# Backend Database Implementation Roadmap

## Goal
Reduce UVS Ultra API requests by implementing persistent storage and user account system.

## Current Architecture
- **Frontend**: React (client/)
- **Proxy API**: Express server (src/api-server.ts)
- **Authentication**: Session-based with UVS Ultra credentials
- **Storage**: localStorage (browser-only, per-device)

## Proposed Architecture

### 1. Database Setup
**Technology Options:**
- PostgreSQL (recommended for production)
- MongoDB (if preferring NoSQL)
- SQLite (for development/testing)

**Schema:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  uvs_ultra_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- UVS Ultra sessions table (encrypted)
CREATE TABLE uvs_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_data TEXT NOT NULL, -- encrypted session cookies
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cached decks table
CREATE TABLE decks (
  id VARCHAR(255) PRIMARY KEY, -- UVS Ultra deck ID
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50),
  card_count INTEGER,
  is_valid BOOLEAN,
  character_image VARCHAR(500),
  deck_data JSONB, -- full deck details
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(id, user_id)
);

-- Sync logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- 'full', 'incremental'
  decks_added INTEGER,
  decks_updated INTEGER,
  decks_removed INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Backend API Endpoints

**Authentication:**
```
POST /api/auth/register
  - Create new user account
  - Hash password with bcrypt
  - Return JWT token

POST /api/auth/login
  - Verify credentials
  - Return JWT token

POST /api/auth/link-uvs-ultra
  - Link UVS Ultra account to user
  - Store encrypted session data
  - Trigger initial deck sync

POST /api/auth/logout
  - Invalidate JWT token
```

**Deck Management:**
```
GET /api/decks
  - Return cached decks from database
  - Check last_synced_at timestamp
  - Auto-sync if > 24 hours old (configurable)

POST /api/decks/sync
  - Manual sync with UVS Ultra
  - Fetch all decks recursively
  - Update database with changes
  - Return sync summary

GET /api/decks/:deckId
  - Return full deck details from cache
  - Fetch from UVS Ultra if not cached

DELETE /api/decks/:deckId
  - Remove deck from cache
  - User can re-sync to restore
```

**User Settings:**
```
GET /api/settings
  - Auto-sync interval (off, daily, weekly)
  - Sync on login (boolean)
  - Cache retention period

PUT /api/settings
  - Update user preferences
```

### 3. Sync Strategy

**Initial Sync (on UVS Ultra link):**
1. Fetch all folders and decks recursively
2. Store in database with current timestamp
3. Return deck count to user

**Incremental Sync:**
1. Check last_synced_at timestamp
2. If > threshold, trigger sync in background
3. Compare deck IDs and update changes only
4. Log sync statistics

**Smart Sync Options:**
- **Manual Only**: User clicks "Refresh Decks"
- **On Login**: Sync when user logs in (if > 24hrs)
- **Scheduled**: Background job runs daily/weekly
- **Webhook** (future): UVS Ultra notifies on deck changes

### 4. Implementation Phases

**Phase 1: Database Setup**
- [ ] Choose database (PostgreSQL recommended)
- [ ] Set up database schema
- [ ] Add database migrations
- [ ] Install ORM (Prisma or TypeORM)

**Phase 2: User Authentication**
- [ ] Implement JWT authentication
- [ ] Create user registration/login
- [ ] Migrate from session-based to JWT
- [ ] Add password reset flow

**Phase 3: Deck Caching**
- [ ] Implement deck storage endpoints
- [ ] Migrate existing sync logic to use DB
- [ ] Add sync logging and statistics
- [ ] Implement cache invalidation

**Phase 4: Optimization**
- [ ] Add database indexing
- [ ] Implement rate limiting
- [ ] Add Redis for session storage
- [ ] Background job queue for syncing

**Phase 5: Enhanced Features**
- [ ] Deck versioning/history
- [ ] Deck sharing between users
- [ ] Deck statistics and analytics
- [ ] Export/import functionality

### 5. Security Considerations

**UVS Ultra Credentials:**
- Store encrypted session cookies (AES-256)
- Never store plaintext passwords
- Implement key rotation
- Add expiration on stored sessions

**API Security:**
- JWT with short expiration (15min)
- Refresh token rotation
- Rate limiting per user/IP
- CORS configuration
- SQL injection prevention (ORM)

**Data Privacy:**
- Encrypt sensitive data at rest
- Use HTTPS only
- Add data retention policies
- Implement user data export/deletion

### 6. Performance Optimization

**Caching Layers:**
```
User Request
    ↓
Redis Cache (hot data, 5min TTL)
    ↓
PostgreSQL (persistent storage)
    ↓
UVS Ultra API (only when needed)
```

**Benefits:**
- 95%+ cache hit rate for deck lists
- Sub-100ms response times
- Reduced UVS Ultra load by ~99%
- Cross-device synchronization

### 7. Migration Path

**From Current to Database-backed:**

1. **Parallel Operation** (2 weeks)
   - Run both localStorage and DB caching
   - Users can opt-in to accounts
   - Monitor for issues

2. **Feature Parity** (1 week)
   - Ensure DB version matches localStorage features
   - Add migration tool for existing users

3. **Gradual Migration** (ongoing)
   - Encourage users to create accounts
   - Keep localStorage as fallback
   - Eventually deprecate session-only mode

### 8. Deployment Considerations

**Infrastructure:**
- PostgreSQL instance (AWS RDS, Heroku, Railway)
- Redis instance (optional, for caching)
- Backend API server (Node.js)
- Frontend hosting (Vercel, Netlify)

**Estimated Costs:**
- Database: $7-20/month (managed PostgreSQL)
- Redis: $0-10/month (optional)
- Backend hosting: $0-7/month (Heroku/Railway)
- Total: ~$15-35/month for production

**Development Stack:**
```
Frontend: React + TypeScript
Backend: Express + TypeScript
ORM: Prisma
Database: PostgreSQL
Auth: JWT + bcrypt
Cache: Redis (optional)
```

### 9. Code Organization

```
server/
  ├── src/
  │   ├── config/
  │   │   └── database.ts
  │   ├── models/
  │   │   ├── User.ts
  │   │   ├── Deck.ts
  │   │   └── SyncLog.ts
  │   ├── services/
  │   │   ├── AuthService.ts
  │   │   ├── DeckSyncService.ts
  │   │   └── UVSUltraService.ts
  │   ├── routes/
  │   │   ├── auth.ts
  │   │   ├── decks.ts
  │   │   └── settings.ts
  │   ├── middleware/
  │   │   ├── authenticate.ts
  │   │   └── rateLimit.ts
  │   └── index.ts
  ├── prisma/
  │   ├── schema.prisma
  │   └── migrations/
  └── package.json
```

### 10. Testing Strategy

**Unit Tests:**
- Database models and queries
- Sync logic and algorithms
- Authentication flows

**Integration Tests:**
- API endpoints
- Database transactions
- UVS Ultra integration

**Load Tests:**
- Concurrent user logins
- Bulk deck syncing
- Cache performance

### 11. Monitoring & Analytics

**Metrics to Track:**
- API response times
- Cache hit/miss rates
- UVS Ultra request count
- Sync frequency and duration
- User activity patterns
- Error rates

**Tools:**
- Application logging (Winston/Pino)
- Error tracking (Sentry)
- Analytics (optional)

## Next Steps

1. Review and approve architecture
2. Choose hosting provider
3. Set up development database
4. Implement Phase 1 (Database Setup)
5. Migrate one feature at a time

## Estimated Timeline

- Phase 1: 1 week
- Phase 2: 1 week
- Phase 3: 2 weeks
- Phase 4: 1 week
- Total: ~5 weeks for full implementation

## Benefits Summary

✅ **Reduced UVS Ultra load**: 99% fewer requests
✅ **Faster response times**: <100ms vs 1-3s
✅ **Cross-device sync**: Access decks anywhere
✅ **Offline support**: Cached data available offline
✅ **Better UX**: No waiting for deck loads
✅ **Analytics**: Track deck usage and popularity
✅ **Scalability**: Support thousands of users

# MongoDB User Guide - Adding Users That Work Automatically

## Collection Names
Your application uses these collection names:
- **Users**: `users` collection
- **Movies**: `movies` collection  
- **Reviews**: `reviews` collection

## Adding a Regular User in MongoDB Compass

1. Open MongoDB Compass
2. Navigate to: `DanielPanWebDev` database → `users` collection
3. Click "ADD DATA" → "Insert Document"
4. Use this JSON structure:

```json
{
  "username": "yourusername",
  "email": "user@example.com",
  "password": "plaintextpassword",
  "role": "RegularUser",
  "joinDate": "2024-01-01",
  "favorites": [],
  "reviews": [],
  "following": [],
  "followers": [],
  "phone": ""
}
```

**Important Fields:**
- `role`: Must be exactly `"RegularUser"` or `"AdminUser"`
- `password`: Currently stored as plain text (will be hashed in production)
- `joinDate`: Required for RegularUser (use date format: `"2024-01-01"` or ISODate)

## Adding an Admin User

```json
{
  "username": "adminusername",
  "email": "admin@example.com",
  "password": "adminpassword",
  "role": "AdminUser",
  "permissionsLevel": 5,
  "canDeleteMovies": true,
  "canRemoveReviews": true,
  "favorites": [],
  "reviews": [],
  "following": [],
  "followers": [],
  "phone": ""
}
```

## Quick Test After Adding

After adding a user, test it:
1. Visit: `http://localhost:3000/api/test-user?email=user@example.com`
2. Should show: `"found": true`
3. Try logging in at `/login` with the email and password

## Current Issue

If your users are in a collection named `DanielPanWebDev` instead of `users`, they won't be found. Make sure to use the `users` collection!


# RESTful Web Services API Documentation

This project uses **Node.js Express** to create RESTful Web services. All API routes are organized in separate files and use Mongoose models to interact with MongoDB.

## API Structure

### Base URL
```
http://localhost:3000/api
```

## Movies API (`/api/movies`)

### GET /api/movies
Get all movies with optional query parameters.

**Query Parameters:**
- `genre` - Filter by genre (e.g., `?genre=Action`)
- `year` - Filter by release year (e.g., `?year=2020`)
- `limit` - Limit number of results (e.g., `?limit=10`)

**Example:**
```
GET /api/movies?genre=Sci-Fi&year=2010&limit=5
```

### GET /api/movies/:id
Get a single movie by ID.

**Path Parameters:**
- `id` - Movie ID (MongoDB ObjectId)

**Example:**
```
GET /api/movies/507f1f77bcf86cd799439011
```

### POST /api/movies
Create a new movie.

**Request Body:**
```json
{
  "title": "Inception",
  "description": "A thief who steals corporate secrets...",
  "releaseYear": 2010,
  "posterURL": "https://example.com/poster.jpg",
  "genre": "Sci-Fi"
}
```

### PUT /api/movies/:id
Update a movie (full update).

**Path Parameters:**
- `id` - Movie ID

**Request Body:** (all fields required)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "releaseYear": 2020,
  "posterURL": "https://example.com/new-poster.jpg",
  "genre": "Action"
}
```

### PATCH /api/movies/:id
Partially update a movie.

**Path Parameters:**
- `id` - Movie ID

**Request Body:** (only fields to update)
```json
{
  "title": "New Title"
}
```

### DELETE /api/movies/:id
Delete a movie.

**Path Parameters:**
- `id` - Movie ID

### GET /api/movies/:id/reviews
Get all reviews for a specific movie.

**Path Parameters:**
- `id` - Movie ID

### POST /api/movies/:id/reviews
Create a review for a movie.

**Path Parameters:**
- `id` - Movie ID

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great movie!",
  "userId": "507f1f77bcf86cd799439012"
}
```

## Users API (`/api/users`)

### GET /api/users
Get all users with optional query parameters.

**Query Parameters:**
- `role` - Filter by role (e.g., `?role=RegularUser`)
- `limit` - Limit number of results (e.g., `?limit=10`)

### GET /api/users/:id
Get a single user by ID.

**Path Parameters:**
- `id` - User ID

**Query Parameters:**
- `viewerId` - If viewerId matches userId, private info (email, phone) is shown

**Example:**
```
GET /api/users/507f1f77bcf86cd799439012?viewerId=507f1f77bcf86cd799439012
```

### POST /api/users
Create a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "RegularUser"
}
```

### PUT /api/users/:id
Update a user (full update).

### PATCH /api/users/:id
Partially update a user (email, phone only).

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "phone": "123-456-7890"
}
```

### DELETE /api/users/:id
Delete a user.

### POST /api/users/:id/favorite/:movieId
Add a movie to user's favorites.

**Path Parameters:**
- `id` - User ID
- `movieId` - Movie ID

### DELETE /api/users/:id/favorite/:movieId
Remove a movie from user's favorites.

### POST /api/users/:id/follow/:followId
Follow another user.

**Path Parameters:**
- `id` - User ID (follower)
- `followId` - User ID (to follow)

### DELETE /api/users/:id/follow/:followId
Unfollow a user.

## Reviews API (`/api/reviews`)

### GET /api/reviews
Get all reviews with optional query parameters.

**Query Parameters:**
- `movieId` - Filter by movie (e.g., `?movieId=507f1f77bcf86cd799439011`)
- `userId` - Filter by user (e.g., `?userId=507f1f77bcf86cd799439012`)
- `rating` - Filter by rating (e.g., `?rating=5`)
- `limit` - Limit number of results (e.g., `?limit=10`)

**Example:**
```
GET /api/reviews?movieId=507f1f77bcf86cd799439011&rating=5
```

### GET /api/reviews/:id
Get a single review by ID.

### POST /api/reviews
Create a new review.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Amazing movie!",
  "movieId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

### PUT /api/reviews/:id
Update a review (full update).

### PATCH /api/reviews/:id
Partially update a review.

### DELETE /api/reviews/:id
Delete a review.

## Auth API (`/api/auth`)

### POST /api/auth/login
User login.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/register
User registration.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

## URL Patterns and Relationships

The API URLs capture relationships between entities:

- **Movies ↔ Reviews**: `/api/movies/:id/reviews` (one-to-many)
- **Users ↔ Favorites**: `/api/users/:id/favorite/:movieId` (many-to-many)
- **Users ↔ Following**: `/api/users/:id/follow/:followId` (many-to-many)
- **Users ↔ Reviews**: `/api/reviews?userId=:id` (one-to-many)

## HTTP Methods

- **GET** - Read/Retrieve data
- **POST** - Create new resources
- **PUT** - Full update of resources
- **PATCH** - Partial update of resources
- **DELETE** - Delete resources

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Models

All routes use Mongoose models:
- `MovieModel` - Movie data model
- `UserModel` - User data model
- `ReviewModel` - Review data model

Models are defined in separate files in the `/models` directory and use promises for all database operations.


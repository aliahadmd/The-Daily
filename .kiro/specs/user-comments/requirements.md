# Requirements Document

## Introduction

This feature adds a public user identity layer and comment system to the international newspaper CMS. Readers can register and log in to the public-facing site using their own accounts (separate from admin accounts). Authenticated readers can post comments on any published article. Admins can view, moderate (approve/reject/delete), and manage comments through the existing CMS dashboard. Admins can also ban user accounts that violate community guidelines; banned users cannot log in or post new comments.

## Glossary

- **Public_User**: A reader who has registered an account on the public-facing newspaper site, distinct from an Admin
- **User_Session**: A secure HTTP-only session cookie identifying an authenticated Public_User on the public site
- **Comment**: A text message posted by an authenticated Public_User on a published Article
- **Comment_Status**: The moderation state of a Comment — one of `pending`, `approved`, or `rejected`
- **Moderation**: The admin action of reviewing and approving, rejecting, or deleting Comments
- **Ban**: An admin action that permanently prevents a Public_User from logging in or posting Comments
- **Registration**: The process by which a visitor creates a Public_User account with a username, email, and password
- **Auth_System**: The authentication subsystem responsible for managing Public_User sessions on the public site
- **Comment_Section**: The UI component rendered below an article body on the Article detail page showing approved comments and a comment submission form
- **Admin_Comments_Page**: The CMS page at `/admin/comments` where admins view and moderate all comments
- **Admin_Users_Page**: The CMS page at `/admin/users` where admins view and manage Public_User accounts

---

## Requirements

### Requirement 1: Public User Registration

**User Story:** As a visitor, I want to create an account on the newspaper site, so that I can participate in article discussions by posting comments.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a registration page at `/register` with fields for username, email address, and password.
2. WHEN a visitor submits the registration form with a unique username, unique email, and a password of at least 8 characters, THE Auth_System SHALL create a Public_User account and redirect the visitor to the homepage.
3. IF a visitor submits a registration form with a username that already exists, THEN THE Auth_System SHALL display a field-level error message and SHALL NOT create a duplicate account.
4. IF a visitor submits a registration form with an email address that already exists, THEN THE Auth_System SHALL display a field-level error message and SHALL NOT create a duplicate account.
5. IF a visitor submits a registration form with a password shorter than 8 characters, THEN THE Auth_System SHALL display a field-level error message and SHALL NOT create the account.
6. THE Auth_System SHALL store Public_User passwords as bcrypt hashes with a minimum cost factor of 12; plaintext passwords SHALL NOT be stored.
7. WHEN a Public_User account is created, THE Auth_System SHALL automatically create a User_Session and log the user in.

---

### Requirement 2: Public User Login and Logout

**User Story:** As a registered user, I want to log in and out of my account, so that I can post comments and manage my session.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a login page at `/login` with fields for email address and password.
2. WHEN a Public_User submits valid credentials, THE Auth_System SHALL create a secure HTTP-only User_Session cookie and redirect the user to the page they were previously viewing, or to the homepage if no prior page is recorded.
3. IF a Public_User submits invalid credentials, THEN THE Auth_System SHALL display an error message and SHALL NOT create a session.
4. IF a banned Public_User attempts to log in, THEN THE Auth_System SHALL display an error message stating the account has been suspended and SHALL NOT create a session.
5. WHEN a logged-in Public_User clicks "Log out", THE Auth_System SHALL invalidate the User_Session cookie and redirect the user to the homepage.
6. THE Auth_System SHALL use a separate session cookie name and secret from the existing admin session to prevent any session collision.

---

### Requirement 3: Comment Posting

**User Story:** As an authenticated reader, I want to post a comment on an article, so that I can share my thoughts and engage with other readers.

#### Acceptance Criteria

1. WHEN a logged-in Public_User views an article page, THE Comment_Section SHALL display a comment submission form below the article body.
2. WHEN a visitor who is not logged in views an article page, THE Comment_Section SHALL display a prompt with links to `/login` and `/register` instead of the submission form.
3. WHEN a logged-in Public_User submits a comment with non-empty body text of at most 2000 characters, THE Comment_Section SHALL save the Comment with a status of `pending` and display a confirmation message to the user.
4. IF a logged-in Public_User submits a comment with an empty body, THEN THE Comment_Section SHALL display a validation error and SHALL NOT save the Comment.
5. IF a logged-in Public_User submits a comment body exceeding 2000 characters, THEN THE Comment_Section SHALL display a validation error and SHALL NOT save the Comment.
6. IF a banned Public_User attempts to submit a comment, THEN THE System SHALL reject the submission with an error message and SHALL NOT save the Comment.
7. THE Comment_Section SHALL display all approved Comments for the article, ordered by creation date ascending, showing the commenter's username and the comment creation timestamp.
8. WHEN an article has no approved Comments, THE Comment_Section SHALL display a message indicating no comments have been posted yet.

---

### Requirement 4: Comment Moderation (CMS)

**User Story:** As an Admin, I want to review and moderate user comments, so that I can maintain the quality and safety of public discussions.

#### Acceptance Criteria

1. THE CMS_Dashboard SHALL include a "Comments" entry in the admin sidebar navigation linking to `/admin/comments`.
2. THE Admin_Comments_Page SHALL display a paginated list of all Comments across all articles, showing the commenter's username, article title, comment body (truncated to 150 characters), Comment_Status, and submission timestamp, ordered by submission timestamp descending.
3. WHEN an Admin clicks "Approve" on a pending or rejected Comment, THE System SHALL set the Comment_Status to `approved`; the Comment SHALL then be visible in the public Comment_Section.
4. WHEN an Admin clicks "Reject" on a pending or approved Comment, THE System SHALL set the Comment_Status to `rejected`; the Comment SHALL no longer be visible in the public Comment_Section.
5. WHEN an Admin clicks "Delete" on a Comment, THE System SHALL permanently remove the Comment record from the database.
6. THE Admin_Comments_Page SHALL provide filter controls to view Comments by status (`pending`, `approved`, `rejected`) and by article.
7. THE Admin_Comments_Page SHALL display the count of pending Comments requiring review as a badge on the sidebar navigation entry.

---

### Requirement 5: User Account Management (CMS)

**User Story:** As an Admin, I want to view and manage public user accounts, so that I can enforce community guidelines and ban users who violate them.

#### Acceptance Criteria

1. THE CMS_Dashboard SHALL include a "Users" entry in the admin sidebar navigation linking to `/admin/users`.
2. THE Admin_Users_Page SHALL display a paginated list of all Public_User accounts showing username, email, registration date, comment count, and account status (active or banned).
3. WHEN an Admin clicks "Ban" on an active Public_User account, THE System SHALL set the user's status to banned; the banned user SHALL be prevented from logging in and from posting new Comments.
4. WHEN an Admin clicks "Unban" on a banned Public_User account, THE System SHALL restore the user's status to active; the user SHALL be able to log in and post Comments again.
5. THE Admin_Users_Page SHALL provide a search input to filter users by username or email.
6. WHEN an Admin bans a Public_User, THE System SHALL NOT automatically delete the user's existing approved Comments; previously approved Comments SHALL remain visible.

---

### Requirement 6: Navigation and Session State

**User Story:** As a reader, I want the site navigation to reflect my login state, so that I can easily access my account actions.

#### Acceptance Criteria

1. WHEN a Public_User is logged in, THE NavBar SHALL display the user's username and a "Log out" button in place of the "Log in" and "Register" links.
2. WHEN no Public_User is logged in, THE NavBar SHALL display "Log in" and "Register" links pointing to `/login` and `/register` respectively.
3. THE NavBar SHALL reflect the current session state on every page without requiring a full page reload after login or logout.

---

### Requirement 7: Data Integrity and Security

**User Story:** As a system operator, I want user data and comments to be stored securely and consistently, so that the platform is safe and reliable.

#### Acceptance Criteria

1. THE System SHALL store Public_User accounts in a dedicated `public_users` database table separate from the `admins` table.
2. THE System SHALL store Comments in a dedicated `comments` table with foreign keys referencing `public_users.id` and `articles.id`, with cascade delete on article deletion.
3. WHEN an article is deleted by an Admin, THE System SHALL cascade-delete all Comments associated with that article.
4. THE Auth_System SHALL use a constant-time password comparison function for login to prevent timing attacks.
5. THE System SHALL validate and sanitize all comment body text server-side before persisting to prevent stored XSS; HTML tags SHALL be stripped from comment body content.
6. THE User_Session cookie SHALL be HTTP-only, SameSite=Lax, and Secure in production environments.
7. THE System SHALL enforce a rate limit of at most 5 comment submissions per Public_User per minute; submissions exceeding this limit SHALL be rejected with an error message.

# Employee Management System

This is my Employee Management System (EMS) project. I developed this project to manage employee information and some common HR activities through a single web application.

The system has two main types of users: **Employee** and **HR/Admin**. Depending on the user's role, different features are available.

## What the project can do

* Employee registration and login
* Employee and HR/Admin roles
* Add, update, delete and view employee details
* Employee directory
* Employee profile
* Department management
* Attendance management
* Leave application and approval
* Salary details
* Project management
* Employee dashboard
* Update password
* Supabase authentication and database

## Technologies Used

* Next.js
* React.js
* JavaScript
* Supabase
* PostgreSQL
* CSS
* Git & GitHub

## Project Structure

The main parts of the project are:

```text
context/       → User context and authentication state
lib/           → Supabase and leave related functions
pages/         → Application pages
public/        → Images and other public files
styles/        → CSS files
supabase/      → Database schema
```

The employee-related pages are inside the `pages/employees` folder.

## Database

I used **Supabase** for the backend and PostgreSQL database.

The database schema used in the project is available in:

```text
supabase/schema.sql
```

Supabase Authentication is also used for handling user accounts and login.

## Running the Project

Clone the repository:

```bash
git clone https://github.com/omparikh2004-lab/employee-management-system.git
```

Go to the project folder:

```bash
cd employee-management-system
```

Install the required packages:

```bash
npm install
```

Create a `.env.local` file in the project folder and add your Supabase details:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then start the project:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Screenshots

Screenshots of the project will be added here.

### Login
<img width="1009" height="598" alt="image" src="https://github.com/user-attachments/assets/bf03f3a0-7c75-4c95-90df-f3503edd3a21" />



### Dashboard

*Screenshot will be added*

### Employee Directory

*Screenshot will be added*

### Employee Profile

*Screenshot will be added*

### Leave Management

*Screenshot will be added*

## About the Project

I made this project as part of my B.Tech IT & Engineering work. The main idea was to create a simple system where employee records and HR-related activities can be managed from one place.

While working on this project, I worked with Next.js, React, Supabase, PostgreSQL, authentication, and Git/GitHub.

## Author

**Om Parikh**

B.Tech IT & Engineering
P P Savani University

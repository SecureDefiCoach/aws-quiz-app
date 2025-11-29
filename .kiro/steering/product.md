# Product Overview

AWS Quiz Application - A full-stack quiz platform for AWS certification exam preparation.

## Core Functionality

- Multi-exam quiz system supporting various AWS certifications (e.g., SCS-C02)
- Adaptive learning with progress tracking and mastery status
- Question bank management with subdomain categorization
- User progress persistence with attempt history
- Smart question selection avoiding mastered content

## Architecture

Backend API (Node.js/Express) serving quiz data and managing user progress, with MongoDB for data persistence. Frontend deployment uses AWS Amplify with Lambda functions for MongoDB connectivity.

## Migration Context

This application was migrated from Google Apps Script to a modern Node.js backend, replacing spreadsheet-based logic with database queries and RESTful APIs.

#!/bin/bash

# scripts/manage-users.sh - Manage Cognito user approvals

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the user pool ID from amplify outputs
AMPLIFY_OUTPUTS="front-end/amplify_outputs.json"

if [ ! -f "$AMPLIFY_OUTPUTS" ]; then
    echo -e "${RED}Error: amplify_outputs.json not found. Make sure sandbox is running.${NC}"
    exit 1
fi

USER_POOL_ID=$(grep -o '"user_pool_id": "[^"]*' "$AMPLIFY_OUTPUTS" | cut -d'"' -f4)

if [ -z "$USER_POOL_ID" ]; then
    echo -e "${RED}Error: Could not find user_pool_id in amplify_outputs.json${NC}"
    exit 1
fi

echo -e "${GREEN}User Pool ID: ${USER_POOL_ID}${NC}\n"

# Function to list all users
list_users() {
    echo -e "${YELLOW}=== All Users ===${NC}"
    aws cognito-idp list-users \
        --user-pool-id "$USER_POOL_ID" \
        --query 'Users[*].[Username, UserStatus, Attributes[?Name==`email`].Value | [0]]' \
        --output table
}

# Function to list unconfirmed users
list_pending() {
    echo -e "${YELLOW}=== Pending Users (Unconfirmed) ===${NC}"
    PENDING=$(aws cognito-idp list-users \
        --user-pool-id "$USER_POOL_ID" \
        --filter "cognito:user_status = \"UNCONFIRMED\"" \
        --query 'Users[*].[Username, Attributes[?Name==`email`].Value | [0]]' \
        --output text)
    
    if [ -z "$PENDING" ]; then
        echo -e "${GREEN}No pending users.${NC}"
    else
        echo "$PENDING" | while read -r username email; do
            echo -e "  ${YELLOW}Email:${NC} $email"
            echo -e "  ${YELLOW}Username:${NC} $username"
            echo ""
        done
    fi
}

# Function to confirm a user
confirm_user() {
    local email=$1
    
    if [ -z "$email" ]; then
        echo -e "${RED}Error: Email address required${NC}"
        echo "Usage: $0 confirm <email>"
        exit 1
    fi
    
    echo -e "${YELLOW}Confirming user: ${email}${NC}"
    
    aws cognito-idp admin-confirm-sign-up \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email"
    
    echo -e "${GREEN}✓ User confirmed successfully!${NC}"
}

# Function to delete a user
delete_user() {
    local email=$1
    
    if [ -z "$email" ]; then
        echo -e "${RED}Error: Email address required${NC}"
        echo "Usage: $0 delete <email>"
        exit 1
    fi
    
    echo -e "${RED}Deleting user: ${email}${NC}"
    
    aws cognito-idp admin-delete-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email"
    
    echo -e "${GREEN}✓ User deleted successfully!${NC}"
}

# Main command handler
case "${1:-list}" in
    list)
        list_users
        ;;
    pending)
        list_pending
        ;;
    confirm)
        confirm_user "$2"
        ;;
    delete)
        delete_user "$2"
        ;;
    help|--help|-h)
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  list              List all users (default)"
        echo "  pending           List only unconfirmed users"
        echo "  confirm <email>   Confirm/approve a user"
        echo "  delete <email>    Delete a user"
        echo "  help              Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 pending"
        echo "  $0 confirm user@example.com"
        echo "  $0 delete user@example.com"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac

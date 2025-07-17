#!/bin/bash
# filepath: /Users/aldenluthfi/Documents/Shenanigans/Typescript/savana/scripts/fetch-sensor-data.sh

# Sensor Data Fetcher Script for Supabase - Multi-Node Support
# This script fetches data from multiple nodes and updates the Supabase database
# Designed to be run as a cron job

# Configuration - set these environment variables or modify directly
API_URL="${API_URL:-<REDACTED_API_URL>}"
NODE_ID_1="${NODE_ID_1:-<REDACTED_NODE_ID_1>}"
NODE_ID_2="${NODE_ID_2:-<REDACTED_NODE_ID_2>}"
API_KEY="${API_KEY:-<REDACTED_API_KEY>}"
SUPABASE_URL="${SUPABASE_URL:-<REDACTED_SUPABASE_URL>}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-<REDACTED_SUPABASE_ANON_KEY>}"

# Array of node IDs to process
NODE_IDS=("$NODE_ID_1" "$NODE_ID_2")

# Function to log messages with timestamp using systemd journal
log_message() {
    logger -t "sensor-data-fetcher" "$1"
}

# Function to check if required commands exist
check_dependencies() {
    local missing_deps=()

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_message "ERROR: Missing required dependencies: ${missing_deps[*]}"
        echo "Please install missing dependencies: ${missing_deps[*]}"
        exit 1
    fi
}

# Function to fetch data from API for a specific node
fetch_api_data() {
    local node_id="$1"
    local response
    local http_code

    log_message "Fetching data from API for node: $node_id"

    response=$(curl -s -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -G \
        --data-urlencode "id_node=$node_id" \
        --data-urlencode "api_key=$API_KEY" \
        "$API_URL" 2>/dev/null)

    if [ $? -ne 0 ]; then
        log_message "ERROR: Failed to fetch data from API for node $node_id"
        return 1
    fi

    http_code="${response: -3}"
    response_body="${response%???}"

    if [ "$http_code" -ne 200 ]; then
        log_message "ERROR: API returned HTTP $http_code for node $node_id"
        log_message "Response: $response_body"
        return 1
    fi

    # Check if response has valid JSON structure
    if ! echo "$response_body" | jq -e '.status' > /dev/null 2>&1; then
        log_message "ERROR: Invalid JSON response from API for node $node_id"
        log_message "Response: $response_body"
        return 1
    fi

    # Check if API status is OK
    local api_status=$(echo "$response_body" | jq -r '.status')
    if [ "$api_status" != "Ok" ]; then
        log_message "ERROR: API returned status: $api_status for node $node_id"
        return 1
    fi

    echo "$response_body"
    return 0
}

# Function to parse JSON and extract sensor data
parse_sensor_data() {
    local json_data="$1"

    # Extract data using jq
    local id_node=$(echo "$json_data" | jq -r '.data.id_node')
    local waktu=$(echo "$json_data" | jq -r '.data.waktu')
    local temperature=$(echo "$json_data" | jq -r '.data.data_node.temp')
    local humidity=$(echo "$json_data" | jq -r '.data.data_node.rh')
    local pressure=$(echo "$json_data" | jq -r '.data.data_node.press')
    local moisture=$(echo "$json_data" | jq -r '.data.data_node.mous')
    local rain=$(echo "$json_data" | jq -r '.data.data_node.rain')

    # Validate required fields
    if [ "$id_node" = "null" ] || [ "$waktu" = "null" ]; then
        log_message "ERROR: Missing required fields (id_node or waktu)"
        return 1
    fi

    # Create JSON payload for Supabase
    cat << EOF
{
    "id_node": "$id_node",
    "waktu": "$waktu",
    "temperature": $([ "$temperature" = "null" ] && echo "null" || echo "$temperature"),
    "humidity": $([ "$humidity" = "null" ] && echo "null" || echo "$humidity"),
    "pressure": $([ "$pressure" = "null" ] && echo "null" || echo "$pressure"),
    "moisture": $([ "$moisture" = "null" ] && echo "null" || echo "$moisture"),
    "rain": $([ "$rain" = "null" ] && echo "null" || echo "$rain")
}
EOF
}

# Function to update Supabase
update_supabase() {
    local sensor_data="$1"
    local response
    local http_code

    log_message "Updating Supabase with sensor data"

    response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Prefer: resolution=merge-duplicates" \
        -d "$sensor_data" \
        "$SUPABASE_URL/rest/v1/sensor_data" 2>/dev/null)

    if [ $? -ne 0 ]; then
        log_message "ERROR: Failed to update Supabase"
        return 1
    fi

    http_code="${response: -3}"
    response_body="${response%???}"

    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
        log_message "SUCCESS: Data updated in Supabase"
        return 0
    else
        log_message "ERROR: Supabase returned HTTP $http_code"
        log_message "Response: $response_body"
        return 1
    fi
}

# Function to process a single node
process_node() {
    local node_id="$1"
    
    log_message "Processing node: $node_id"
    
    # Fetch data from API
    local api_data
    if ! api_data=$(fetch_api_data "$node_id"); then
        log_message "ERROR: Failed to fetch API data for node $node_id"
        return 1
    fi

    # Parse sensor data
    local sensor_data
    if ! sensor_data=$(parse_sensor_data "$api_data"); then
        log_message "ERROR: Failed to parse sensor data for node $node_id"
        return 1
    fi

    # Update Supabase
    if ! update_supabase "$sensor_data"; then
        log_message "ERROR: Failed to update Supabase for node $node_id"
        return 1
    fi

    log_message "Successfully processed node: $node_id"
    return 0
}

# Main function
main() {
    log_message "Starting multi-node sensor data fetch process"

    # Check dependencies
    check_dependencies

    local success_count=0
    local total_nodes=${#NODE_IDS[@]}

    # Process each node
    for node_id in "${NODE_IDS[@]}"; do
        if [ -n "$node_id" ] && [ "$node_id" != "<REDACTED_NODE_ID_1>" ] && [ "$node_id" != "<REDACTED_NODE_ID_2>" ]; then
            if process_node "$node_id"; then
                ((success_count++))
            fi
        else
            log_message "WARNING: Skipping empty or placeholder node ID: $node_id"
        fi
    done

    if [ $success_count -eq $total_nodes ]; then
        log_message "All $total_nodes nodes processed successfully"
    elif [ $success_count -gt 0 ]; then
        log_message "Partial success: $success_count/$total_nodes nodes processed successfully"
    else
        log_message "ERROR: No nodes were processed successfully"
        exit 1
    fi

    log_message "Multi-node sensor data fetch process completed"
}

# Run main function
main "$@"
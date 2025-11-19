import requests
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# OpenPhone API configuration (replace with actual values)
API_KEY = 'your_openphone_api_key_here'  # Set your API key here
BASE_URL = 'https://api.openphone.com/v1'  # OpenPhone API base URL

def send_message(to, message):
    """
    Send a single message to a recipient using OpenPhone API.
    Returns True if successful, False otherwise.
    """
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    data = {
        'to': to,
        'message': message
    }
    try:
        response = requests.post(f'{BASE_URL}/messages', json=data, headers=headers)
        if response.status_code == 201:  # Assuming 201 Created for success
            return True
        else:
            logging.warning(f"Failed to send message to {to}: {response.status_code} - {response.text}")
            return False
    except requests.RequestException as e:
        logging.error(f"Request error sending to {to}: {e}")
        return False

def send_batch(recipients, message):
    """
    Send messages to a batch of recipients with retry logic.
    Returns tuple: (successes, failures)
    """
    successes = 0
    failures = 0

    for phone in recipients:
        success = False
        for attempt in range(4):  # Up to 3 retries (attempts 0, 1, 2, 3)
            if send_message(phone, message):
                success = True
                successes += 1
                logging.info(f"Successfully sent message to {phone}")
                break
            else:
                if attempt < 3:  # Don't sleep after last attempt
                    delay = 2 ** attempt  # Exponential backoff: 1, 2, 4 seconds
                    logging.info(f"Retrying send to {phone} in {delay} seconds (attempt {attempt + 1})")
                    time.sleep(delay)

        if not success:
            failures += 1
            logging.error(f"Failed to send message to {phone} after 3 retries")

    return successes, failures

def broadcast_messages(recipients, message):
    """
    Broadcast messages to all recipients in batches of 10, with 1-second delay between batches.
    """
    batch_size = 10
    total_batches = (len(recipients) + batch_size - 1) // batch_size  # Ceiling division

    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(recipients))
        batch = recipients[start_idx:end_idx]

        logging.info(f"Processing batch {batch_num + 1}/{total_batches} with {len(batch)} recipients")

        successes, failures = send_batch(batch, message)

        logging.info(f"Batch {batch_num + 1} completed: {successes} successes, {failures} failures")

        # Delay 1 second between batches (except after the last batch)
        if batch_num < total_batches - 1:
            time.sleep(1)

    logging.info("Message broadcasting completed")

# Example usage
if __name__ == "__main__":
    # Replace with actual recipient phone numbers (in E.164 format, e.g., '+1234567890')
    recipients = [
        '+1234567890',
        '+1234567891',
        '+1234567892',
        # Add more recipients as needed
    ]

    message = "Your broadcast message here"

    broadcast_messages(recipients, message)
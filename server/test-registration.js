// File: server/test-registration.js

// This script simulates a mobile phone sending data to your server
const testRegistration = async () => {
    console.log("...Attempting to register Agent007...");

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "Agent007",
                email: "bond@secret.com",
                password: "topSecretPassword123",
                safePin: "1234",
                panicPin: "9999"
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ SUCCESS: Operation Successful!");
            console.log("Server Response:", data);
        } else {
            console.log("❌ FAILED:", data);
        }

    } catch (error) {
        console.log("❌ ERROR: Is the server running?", error.message);
    }
};

testRegistration();
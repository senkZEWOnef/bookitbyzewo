"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SimpleTest() {
  const [status, setStatus] = useState("Loading...");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const test = async () => {
      try {
        console.log("Testing session...");

        // Clear any existing session first
        await supabase.auth.signOut();

        // Wait a moment
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try to sign in directly
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "ralph.ulysse509@gmail.com", // Replace with your actual email
          password: "Poesie509$", // Replace with your actual password
        });

        if (error) {
          setStatus(`❌ Login failed: ${error.message}`);
          return;
        }

        setStatus("✅ Login successful! Checking session...");
        setUser(data.user);

        // Now test session retrieval
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus(`❌ Session error: ${sessionError.message}`);
        } else if (session) {
          setStatus(`✅ Session works! User: ${session.user?.email}`);
        } else {
          setStatus("❌ No session found");
        }
      } catch (err) {
        setStatus(`💥 Error: ${err}`);
        console.error("Test error:", err);
      }
    };

    test();
  }, []);

  return (
    <div className="container mt-5">
      <h1>🧪 Auth Test</h1>
      <div className="card">
        <div className="card-body">
          <h5>Status:</h5>
          <p>{status}</p>

          {user && (
            <div>
              <h5>User Data:</h5>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Run Test Again
          </button>
        </div>
      </div>
    </div>
  );
}

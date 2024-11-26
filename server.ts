// import { serve } from "https://deno.land/x/sift/mod.ts";

// // Load environment variables
// import { load } from "https://deno.land/std/dotenv/mod.ts";

// const env = await load();
// console.log("Loaded env variables:", env);

// const accountSid = env["TWILIO_ACCOUNT_SID"];
// const authToken = env["TWILIO_AUTH_TOKEN"];
// const twilioPhoneNumber = env["TWILIO_PHONE_NUMBER"];

// // Base64 encode your credentials
// const credentials = btoa(`${accountSid}:${authToken}`);

// console.log("Account SID:", accountSid);
// console.log("Auth Token:", authToken);
// console.log("Twilio Phone Number:", twilioPhoneNumber);

// serve({
//   "/send-sms": async (req) => {
//     if (req.method !== "POST") {
//       return new Response("Method Not Allowed", { status: 405 });
//     }

//     const body = await req.json();
//     const to = body.to;
//     const message = body.message;

//     console.log(`Sending message to ${to}: ${message}`);

//     try {
//       const response = await fetch(
//         `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Basic ${credentials}`,
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//           body: new URLSearchParams({
//             From: twilioPhoneNumber,
//             To: to,
//             Body: message,
//           }).toString(),
//         }
//       );

//       const messageResponse = await response.json();
//       console.log("Twilio Response:", messageResponse); // Log full response

//       if (response.ok) {
//         return new Response(
//           JSON.stringify({ success: true, messageId: messageResponse.sid }),
//           {
//             headers: { "Content-Type": "application/json" },
//           }
//         );
//       } else {
//         return new Response(
//           JSON.stringify({ success: false, error: messageResponse.message }),
//           {
//             headers: { "Content-Type": "application/json" },
//           }
//         );
//       }
//     } catch (error) {
//       console.error("Error sending SMS:", error.message); // Log error
//       return new Response(
//         JSON.stringify({ success: false, error: error.message }),
//         {
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }
//   },
// });

// console.log("Server is running on http://localhost:8000");

/////////////////////////////////////////

//////
//
////

import { serve } from "https://deno.land/x/sift/mod.ts";

// Load environment variables
import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();
console.log("Loaded env variables:", env);

const accountSid = env["TWILIO_ACCOUNT_SID"];
const authToken = env["TWILIO_AUTH_TOKEN"];
const twilioPhoneNumber = env["TWILIO_PHONE_NUMBER"];
const sendGridApiKey = env["SENDGRID_API_KEY"];
const sendGridFromEmail = env["SENDGRID_FROM_EMAIL"]; // Use the correct variable for the 'from' email

// Base64 encode your credentials for Twilio
const credentials = btoa(`${accountSid}:${authToken}`);

console.log("Account SID:", accountSid);
console.log("Auth Token:", authToken);
console.log("Twilio Phone Number:", twilioPhoneNumber);
console.log("SendGrid API Key Loaded:", !!sendGridApiKey); // Check if SendGrid API key is loaded

function setCorsHeaders(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
}

serve({
  "/send-sms": async (req) => {
    if (req.method === "OPTIONS") {
      const response = new Response(null, { status: 204 });
      setCorsHeaders(response);
      return response;
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json();
    const to = body.to;
    const message = body.message;

    console.log(`Sending SMS to ${to}: ${message}`);

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: to,
            From: twilioPhoneNumber,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        console.log("SMS sent successfully");
        const successResponse = new Response(
          JSON.stringify({ success: true }),
          { headers: { "Content-Type": "application/json" } }
        );
        setCorsHeaders(successResponse);
        return successResponse;
      } else {
        const errorResponse = await response.json();
        console.error("Twilio Error:", errorResponse);
        const errorMessageResponse = new Response(
          JSON.stringify({ success: false, error: errorResponse.message }),
          { headers: { "Content-Type": "application/json" } }
        );
        setCorsHeaders(errorMessageResponse);
        return errorMessageResponse;
      }
    } catch (error) {
      console.error("Error sending SMS:", error.message);
      const errorResponse = new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { "Content-Type": "application/json" } }
      );
      setCorsHeaders(errorResponse);
      return errorResponse;
    }
  },

  "/send-email": async (req) => {
    if (req.method === "OPTIONS") {
      const response = new Response(null, { status: 204 });
      setCorsHeaders(response);
      return response;
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json();
    const toEmail = body.to;
    const subject = body.subject;
    const text = body.text;

    console.log(`Sending email to ${toEmail} with subject "${subject}"`);

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: toEmail }],
              subject: subject,
            },
          ],
          from: { email: sendGridFromEmail }, // Ensure the correct "from" email is used
          content: [
            {
              type: "text/plain",
              value: text,
            },
          ],
        }),
      });

      if (response.ok) {
        console.log("Email sent successfully");
        const successResponse = new Response(
          JSON.stringify({ success: true }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setCorsHeaders(successResponse);
        return successResponse;
      } else {
        const errorResponse = await response.json();
        console.error("SendGrid Error:", errorResponse);
        const errorMessageResponse = new Response(
          JSON.stringify({ success: false, error: errorResponse.message }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setCorsHeaders(errorMessageResponse);
        return errorMessageResponse;
      }
    } catch (error) {
      console.error("Error sending email:", error.message);
      const errorResponse = new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setCorsHeaders(errorResponse);
      return errorResponse;
    }
  },
});

console.log("Server is running on http://localhost:8000");

const SPREADSHEET_ID = "1ozunzngWJJ66UqGvhS5_qNlgMk9pOIGmwF-Q4gSuqvo";

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Get packages data
    const packagesSheet = spreadsheet.getSheetByName("Packages");
    const packagesData = packagesSheet.getDataRange().getValues();

    // Convert packages to object more efficiently, skipping header row
    const packageAvailability = Object.fromEntries(
      packagesData.slice(1).map((row) => [row[0], row[1]])
    );

    // Get dates data using getDisplayValues() to get formatted text
    const datesSheet = spreadsheet.getSheetByName("Dates");
    const datesData = datesSheet.getDataRange().getDisplayValues(); // Changed to getDisplayValues()

    // Convert dates to array of objects, skipping header row
    const availableDates = datesData
      .slice(1)
      .filter((row) => row[5] === "TRUE") // Compare with string 'TRUE' since it's display value
      .map((row, index) => ({
        id: `date-${index}`,
        label: row[0],
        departure: row[1],
        arrival: row[2],
        returnDeparture: row[3],
        returnArrival: row[4],
        available: row[5] === "TRUE",
      }));

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: {
          packages: packageAvailability,
          dates: availableDates,
        },
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("doGet error:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // Log the incoming request for debugging
    console.log("Received POST request");
    console.log("postData:", e.postData);
    console.log("postData.contents:", e.postData.contents);

    const data = JSON.parse(e.postData.contents);
    console.log("Parsed data:", data);
    console.log("Data type:", data.type);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.type === "newsletter") {
      console.log("Processing newsletter registration");

      // Check if Newsletter sheet exists
      let newsletterSheet = spreadsheet.getSheetByName("Newsletter");
      if (!newsletterSheet) {
        console.log("Newsletter sheet not found, creating it...");
        newsletterSheet = spreadsheet.insertSheet("Newsletter");
        // Add headers
        newsletterSheet.appendRow(["Timestamp", "Email"]);
      }

      // Ensure we have the required data
      if (!data.email) {
        throw new Error("Email is required for newsletter registration");
      }

      console.log("Adding newsletter registration:", data.email);

      const timestamp = data.timestamp || new Date().toISOString();
      newsletterSheet.appendRow([timestamp, data.email]);

      console.log("Newsletter registration successful");
    } else {
      console.log("Processing booking registration");

      // Check if Bookings sheet exists
      let bookingsSheet = spreadsheet.getSheetByName("Bookings");
      if (!bookingsSheet) {
        console.log("Bookings sheet not found, creating it...");
        bookingsSheet = spreadsheet.insertSheet("Bookings");
        // Add headers
        bookingsSheet.appendRow([
          "Timestamp",
          "Package Name",
          "Selected Date",
          "Flight Departure",
          "Flight Return",
          "First Name",
          "Last Name",
          "Email",
          "Phone",
          "Special Requests",
        ]);
      }

      const timestamp = data.timestamp || new Date().toISOString();
      bookingsSheet.appendRow([
        timestamp,
        data.packageName || "",
        data.selectedDate || "",
        data.flightDeparture || "",
        data.flightReturn || "",
        data.firstName || "",
        data.lastName || "",
        data.email || "",
        data.phone || "",
        data.specialRequests || "",
      ]);

      console.log("Booking registration successful");
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("doPost error:", error);
    console.error("Error details:", error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
        details: "Check execution logs for more information",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to test the newsletter functionality
function testNewsletterRegistration() {
  const testData = {
    type: "newsletter",
    email: "test@example.com",
    timestamp: new Date().toISOString(),
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData),
    },
  };

  const result = doPost(mockEvent);
  console.log("Test result:", result.getContent());
}

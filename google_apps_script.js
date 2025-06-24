const SPREADSHEET_ID = "1ozunzngWJJ66UqGvhS5_qNlgMk9pOIGmwF-Q4gSuqvo";

// Package capacity requirements
const PACKAGE_CAPACITIES = {
  private: 1,
  "chapa-dux": 2,
  trindade: 3,
  "quatro-vinte": 4,
  "high-five": 5,
};

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Get Morroco sheet data
    const morrocoSheet = spreadsheet.getSheetByName("Morroco");
    const morrocoData = morrocoSheet.getDataRange().getDisplayValues();

    // Skip header row and process data
    const dates = morrocoData.slice(1).map((row, index) => {
      const capacity = parseInt(row[1]) || 12;
      const bookings = parseInt(row[2]) || 0;
      const remainingCapacity = capacity - bookings;

      return {
        id: `date-${index}`,
        label: row[0],
        capacity: capacity,
        bookings: bookings,
        remainingCapacity: remainingCapacity,
        departure: row[3],
        arrival: row[4],
        returnDeparture: row[5],
        returnArrival: row[6],
        available: remainingCapacity > 0,
      };
    });

    // Calculate package availability for main page
    // A package is available if at least one date has enough remaining capacity
    const packageAvailability = {};

    Object.keys(PACKAGE_CAPACITIES).forEach((packageId) => {
      const requiredCapacity = PACKAGE_CAPACITIES[packageId];
      const hasAvailableDate = dates.some(
        (date) => date.remainingCapacity >= requiredCapacity
      );
      packageAvailability[packageId] = hasAvailableDate;
    });

    // Filter available dates (dates with remaining capacity > 0)
    const availableDates = dates.filter((date) => date.available);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: {
          packages: packageAvailability,
          dates: availableDates,
          allDates: dates, // Include all dates for package filtering after date selection
        },
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.type === "newsletter") {
      spreadsheet
        .getSheetByName("Newsletter")
        .appendRow([data.timestamp, data.email]);
    } else {
      spreadsheet
        .getSheetByName("Bookings")
        .appendRow([
          data.timestamp,
          data.packageName,
          data.selectedDate,
          data.flightDeparture,
          data.flightReturn,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.specialRequests,
        ]);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

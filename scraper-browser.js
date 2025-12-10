// Pure JavaScript scraper for browser console
// Copy and paste this entire script into your browser console

// Configuration
const API_BASE = 'https://app.usebraintrust.com/api';
const LOCAL_API_URL = 'http://localhost:3000/api/talent';
const START_PAGE = 1; // Change this to your starting page
const END_PAGE = 10; // Change this to your ending page
const DELAY_MS = 1000; // Delay between requests in milliseconds

// Helper function to make HTTP requests using fetch API
async function makeRequest(url, method = 'GET', data = null) {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Enable CORS for localhost
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    let responseData;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    throw error;
  }
}

// Fetch list of talents from a specific page
async function fetchTalentsPage(page, location = 'united_states_only') {
  const url = `${API_BASE}/talent/?custom_location=${location}&page=${page}`;
  console.log(`Fetching page ${page}...`);
  
  try {
    const response = await makeRequest(url);
    if (response.status === 200) {
      return response.data;
    } else {
      console.error(`Error fetching page ${page}: Status ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    return null;
  }
}

// Fetch detailed information for a specific talent
async function fetchTalentDetails(talentId) {
  const url = `${API_BASE}/freelancers/${talentId}`;
  
  try {
    const response = await makeRequest(url);
    if (response.status === 200) {
      return response.data;
    } else {
      console.error(`Error fetching talent ${talentId}: Status ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching talent ${talentId}:`, error.message);
    return null;
  }
}

// Save talent data to MongoDB via local API
async function saveTalentToMongoDB(talentData) {
  try {
    const response = await makeRequest(LOCAL_API_URL, 'PUT', talentData);
    if (response.status === 200 || response.status === 201) {
      return true;
    } else {
      console.error(`Error saving talent ${talentData.id}: Status ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`Error saving talent ${talentData.id}:`, error.message);
    return false;
  }
}

// Delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main scraping function
async function scrapeTalents(startPage, endPage) {
  console.log(`Starting scrape from page ${startPage} to ${endPage}...`);
  
  let currentPage = startPage;
  let totalSaved = 0;
  let totalErrors = 0;

  while (currentPage <= endPage) {
    // Fetch list of talents for current page
    const pageData = await fetchTalentsPage(currentPage);
    
    if (!pageData || !pageData.results) {
      console.log(`No data found for page ${currentPage}, stopping...`);
      break;
    }

    console.log(`Page ${currentPage}: Found ${pageData.results.length} talents`);

    // Process each talent
    for (const talent of pageData.results) {
      const talentId = talent.id;
      console.log(`Processing talent ID: ${talentId} (${talent.user?.public_name || 'Unknown'})`);

      // Fetch detailed information
      const talentDetails = await fetchTalentDetails(talentId);
      
      if (talentDetails) {
        // Merge basic info with detailed info
        const fullTalentData = {
          ...talentDetails,
          // Ensure we have the basic info from the list
          search_score: talent.search_score,
          matching_skills_percent: talent.matching_skills_percent,
          personal_rank: talent.personal_rank,
        };

        // Save to MongoDB
        const saved = await saveTalentToMongoDB(fullTalentData);
        if (saved) {
          totalSaved++;
          console.log(`✓ Saved talent ${talentId}`);
        } else {
          totalErrors++;
          console.log(`✗ Failed to save talent ${talentId}`);
        }
      } else {
        totalErrors++;
        console.log(`✗ Failed to fetch details for talent ${talentId}`);
      }

      // Delay between talent requests
      await delay(DELAY_MS);
    }

    // Check if there's a next page
    if (!pageData.next) {
      console.log(`No more pages available. Stopping at page ${currentPage}.`);
      break;
    }

    currentPage++;
    
    // Delay between page requests
    await delay(DELAY_MS);
  }

  console.log(`\n=== Scraping Complete ===`);
  console.log(`Total talents saved: ${totalSaved}`);
  console.log(`Total errors: ${totalErrors}`);
  
  return { totalSaved, totalErrors };
}

// Usage in browser console:
// 1. Copy and paste this entire script
// 2. Then run: scrapeTalents(1, 10)
//    Or: scrapeTalents(START_PAGE, END_PAGE)
//
// Example:
// scrapeTalents(1, 5)  // Scrape pages 1 to 5

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  window.scrapeTalents = scrapeTalents;
  window.fetchTalentsPage = fetchTalentsPage;
  window.fetchTalentDetails = fetchTalentDetails;
  window.saveTalentToMongoDB = saveTalentToMongoDB;

  console.log('Scraper loaded! Use scrapeTalents(startPage, endPage) to start scraping.');
  console.log('Example: scrapeTalents(1, 10)');
}


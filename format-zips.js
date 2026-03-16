const fs = require("fs");
const path = require("path");

// Point the script to the 'zip' folder
const files = [
  path.join("zip", "US.txt"),
  path.join("zip", "GB.txt"),
  path.join("zip", "RO.txt"),
  path.join("zip", "HU.txt"),
];
const outputFile = "postal_codes_ready.csv";

// 1. Create the file and add the Supabase column headers
fs.writeFileSync(outputFile, "zip_code,city,admin1,admin2\n");

// 2. Loop through each text file
files.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.log(`Could not find ${file}, skipping...`);
    return;
  }

  const data = fs.readFileSync(file, "utf8");
  const lines = data.split("\n");

  let csvContent = "";

  lines.forEach((line) => {
    if (!line.trim()) return;

    const cols = line.split("\t");

    // Extract the specific columns
    const zip = cols[1] || "";
    const city = cols[2] ? cols[2].replace(/"/g, "") : "";
    const admin1 = cols[3] ? cols[3].replace(/"/g, "") : "";
    const admin2 = cols[5] ? cols[5].replace(/"/g, "") : "";

    csvContent += `"${zip}","${city}","${admin1}","${admin2}"\n`;
  });

  // 3. Append to the master CSV file
  fs.appendFileSync(outputFile, csvContent);
  console.log(`Successfully formatted: ${file}`);
});

console.log(`\nDone! You can now upload ${outputFile} directly to Supabase.`);

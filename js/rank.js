function drawLeaderboard(data, yAxisVariable) {
  // Aggregate and compute averages for each country
  const countries = ["France", "Italy", "Netherlands"];
  const countryData = countries.map(country => {
    const countryRows = data.filter(d => d.Country === country && d.Sex === "Total");
    const averageValue =
      countryRows.reduce((sum, row) => sum + +row[yAxisVariable], 0) / countryRows.length;
    return { country, value: averageValue };
  });

  // Sort countries by average value in descending order
  const sortedData = countryData.sort((a, b) => b.value - a.value);

  // Clear previous SVG content
  d3.select("#rank-chart").select("svg").remove();

  // Create SVG container with increased size
  const svg = d3.select("#rank-chart").append("svg")
    .attr("viewBox", "0 0 800 600")
    .attr("width", 800)
    .attr("height", 600)
    .style("margin", "auto")
    .style("display", "block");

  // Define gradients for bars
  const gradients = {
    France: ["#4682B4", "#5A9BD4"],
    Italy: ["#32CD32", "#66FF66"],
    Netherlands: ["#FF8C00", "#FFA54D"]
  };

  const defs = svg.append("defs");
  countries.forEach(country => {
    const gradient = defs.append("linearGradient")
      .attr("id", `gradient-${country}`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", gradients[country][0]);
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", gradients[country][1]);
  });
  
const barWidth = 200; // Increased bar width
const barHeights = [320, 240, 160]; // Proper heights for podium rank
const xPositions = [320, 70, 555]; // Adjusted x-positions for better spacing
const yPositions = [110, 190, 270]; // Adjusted y-positions for podium effect


  // Flags for countries
  const countryFlags = {
    France: "https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg",
    Italy: "https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg",
    Netherlands: "https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg"
  };

  // Position labels (1st, 2nd, 3rd)
  const positionLabels = ["1st", "2nd", "3rd"];

  // Tooltip for hover
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("font-family", "Arial")
    .style("font-size", "14px");

  // Create podium bars with gradient and updated styles
  sortedData.forEach((d, i) => {
    // Draw bars with gradient fill
    svg.append("rect")
      .attr("x", xPositions[i])
      .attr("y", yPositions[i])
      .attr("width", barWidth)
      .attr("height", barHeights[i])
      .attr("fill", `url(#gradient-${d.country})`)
      .attr("rx", 10) // Rounded corners
      .on("mouseover", (event) => {
        tooltip.style("display", "block")
          .html(`
            <strong>Country:</strong> ${d.country}<br>
            <strong>Health Factor:</strong> ${yAxisVariable}<br>
            <strong>Percentage of Students:</strong> ${d.value.toFixed(1)}%
          `);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    // Add flag images on top of bars
    svg.append("image")
      .attr("href", countryFlags[d.country])
      .attr("x", xPositions[i] + barWidth / 2 - 20)
      .attr("y", yPositions[i] - 60)
      .attr("width", 40)
      .attr("height", 30);

    // Add position labels inside bars
    svg.append("text")
      .attr("x", xPositions[i] + barWidth / 2)
      .attr("y", yPositions[i] + barHeights[i] / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "36px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text(positionLabels[i]);

    // Add country labels below bars
    svg.append("text")
      .attr("x", xPositions[i] + barWidth / 2)
      .attr("y", yPositions[i] + barHeights[i] + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text(d.country);
  });
}

// Dropdown change handler
function onDropdownChange(yAxisVariable, healthData) {
  drawLeaderboard(healthData, yAxisVariable);
}

// Initialize chart
Promise.all([d3.csv("data/health_data.csv")]).then(([healthData]) => {
  // Parse numeric fields
  healthData.forEach(d => {
    d["Fruit Consumption (%)"] = +d["Fruit Consumption (%)"];
    d["Vegetable Consumption (%)"] = +d["Vegetable Consumption (%)"];
    d["SPH"] = +d["SPH"];
  });

  // Initial plot with default dropdown value
  const defaultVariable = "Fruit Consumption (%)";
  drawLeaderboard(healthData, defaultVariable);

  // Update chart on dropdown change
  d3.select("#y-axis-select-rank").on("change", function () {
    onDropdownChange(this.value, healthData);
  });
});

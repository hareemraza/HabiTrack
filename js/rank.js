function drawLeaderboard(containerId, data, yAxisVariable = null) {
  // Clear previous SVG content completely
  d3.select(`#${containerId}`).html("");

  let countryData;
  if (yAxisVariable) {
    // Compute averages from actual data if yAxisVariable is provided
    const countries = ["France", "Italy", "Netherlands"];
    countryData = countries.map(country => {
      const countryRows = data.filter(d => d.Country === country && d.Sex === "Total");
      const averageValue =
        countryRows.reduce((sum, row) => sum + +row[yAxisVariable], 0) / countryRows.length;
      return { country, value: averageValue };
    });
  } else {
    // Use hardcoded data directly
    countryData = data;
  }

  // Sort countries by value in descending order
  const sortedData = countryData.sort((a, b) => b.value - a.value);

  // Create SVG container
  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("viewBox", "0 0 800 600")
    .attr("width", 800)
    .attr("height", 600)
    .style("margin", "auto")
    .style("display", "block");

  // Define gradients for bars (only once per container)
  if (!document.getElementById(`gradient-defs-${containerId}`)) {
    const defs = svg.append("defs").attr("id", `gradient-defs-${containerId}`);
    const gradients = {
      France: ["#4682B4", "#5A9BD4"],
      Italy: ["#32CD32", "#66FF66"],
      Netherlands: ["#FF8C00", "#FFA54D"]
    };
    Object.keys(gradients).forEach(country => {
      const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${country}-${containerId}`)
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
  }

  const barWidth = 200;
  const barHeights = [320, 240, 160];
  const xPositions = [320, 70, 555];
  const yPositions = [110, 190, 270];
  const countryFlags = {
    France: "https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg",
    Italy: "https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg",
    Netherlands: "https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg"
  };
  const positionLabels = ["1st", "2nd", "3rd"];

  // Tooltip for hover functionality
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

  const rankings = {
    France: { bmi: "1st", sph: "2nd" },
    Italy: { bmi: "2nd", sph: "3rd" },
    Netherlands: { bmi: "3rd", sph: "1st" },
  };

  // Draw bars, flags, and labels
  sortedData.forEach((d, i) => {
    svg.append("rect")
      .attr("x", xPositions[i])
      .attr("y", yPositions[i])
      .attr("width", barWidth)
      .attr("height", barHeights[i])
      .attr("fill", `url(#gradient-${d.country}-${containerId})`)
      .attr("rx", 10)
      .on("mouseover", (event) => {
        tooltip.style("display", "block")
          .html(`
            <strong>${d.country}</strong><br>
            Ranked <strong>${rankings[d.country].bmi}</strong> for students with the healthiest BMI levels.<br>
            Ranked <strong>${rankings[d.country].sph}</strong> for students with the best perception of their health.
          `);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    svg.append("image")
      .attr("href", countryFlags[d.country])
      .attr("x", xPositions[i] + barWidth / 2 - 20)
      .attr("y", yPositions[i] - 60)
      .attr("width", 40)
      .attr("height", 30);

    svg.append("text")
      .attr("x", xPositions[i] + barWidth / 2)
      .attr("y", yPositions[i] + barHeights[i] / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "36px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text(positionLabels[i]);

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

function initializeTabs(data) {
  const dietaryTab = document.querySelector(".tab-button[data-tab='dietary-factors']");
  const healthTab = document.querySelector(".tab-button[data-tab='health-factors']");

  dietaryTab.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelector("#dietary-factors").classList.add("active");
    document.querySelectorAll(".tab-button").forEach(el => el.classList.remove("active"));
    dietaryTab.classList.add("active");

    // Draw leaderboard using actual data for Dietary Factors
    drawLeaderboard("dietary-chart", data, "Fruit Consumption (%)");
  });

  healthTab.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelector("#health-factors").classList.add("active");
    document.querySelectorAll(".tab-button").forEach(el => el.classList.remove("active"));
    healthTab.classList.add("active");

    // Draw leaderboard using hardcoded data for Health Factors
    const hardcodedHealthData = [
      { country: "Netherlands", value: 90 }, // 1st
      { country: "France", value: 80 }, // 2nd
      { country: "Italy", value: 70 }, // 3rd
    ];
    drawLeaderboard("health-chart", hardcodedHealthData);
  });
}

// Initialize chart and tabs
Promise.all([d3.csv("data/health_data.csv")]).then(([healthData]) => {
  healthData.forEach(d => {
    d["Fruit Consumption (%)"] = +d["Fruit Consumption (%)"];
    d["Vegetable Consumption (%)"] = +d["Vegetable Consumption (%)"];
    d["SPH"] = +d["SPH"];
  });

  // Initialize tabs and default rendering
  initializeTabs(healthData);
  drawLeaderboard("dietary-chart", healthData, "Fruit Consumption (%)"); // Default chart
});

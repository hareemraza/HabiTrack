const widthHC = 1200;
const heightHC = 700;
let selectedCountry = null;

const svgHC = d3
  .select("#honeycomb")
  .append("svg")
  .attr("width", widthHC)
  .attr("height", heightHC)
  .style("margin-bottom", "10px");
  // .style("border", "1px solid #ccc");

  svgHC
  .append("text")
  .attr("x", widthHC / 2)
  .attr("y", 40)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-weight", "bold");
// Sub-head / description
svgHC
  .append("text")
  .attr("x", widthHC / 2)
  .attr("y", 60)
  .attr("text-anchor", "middle")
  .style("font-size", "14px");

// Global data arrays
let healthDataAll = [];
let sportsDataAll = [];
const countries = ["France", "Italy", "Netherlands"];

const colorScaleHC = d3.scaleOrdinal()
  .domain(countries)
  .range(["rgb(0, 112, 192)", "rgb(0, 128, 0)", "rgb(255, 165, 0)"]);

// Circles of “0” → radius ~ 0 px
// Circles of “100” → radius ~ 50 px
const circleSizeScale = d3.scaleLinear()
  .domain([25, 100])      // all data is assumed between 0 and 100
  .range([20, 40])        // or [10, 50] if you want a minimum radius
  .clamp(true);          // clamp so values >100 or <0 don't exceed range

// Create a tooltip DIV (in the same container as the chart)
const tooltipHC = d3
  .select("#honeycomb")
  .append("div")
  .attr("class", "tooltiphc")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("color", "#333")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("font-size", "16px")
  .style("visibility", "hidden"); // hidden by default


/* ---------------------------------------------------
   1) LOAD DATA
---------------------------------------------------- */
d3.csv("data/health_data.csv").then(data => {
  healthDataAll = data;
  healthDataAll.forEach(d => {
    d["Fruit Consumption (%)"] = +d["Fruit Consumption (%)"];
    d["Vegetable Consumption (%)"] = +d["Vegetable Consumption (%)"];
  });
  if (sportsDataAll.length > 0) updateAll("2022");
});

d3.csv("data/sports_data.csv").then(data => {
  sportsDataAll = data;
  sportsDataAll.forEach(d => {
    d["SPH"] = +d["SPH"];
    d["Healthy (%)"] = +d["Healthy (%)"];
  });
  if (healthDataAll.length > 0) updateAll("2022");
});



/* ---------------------------------------------------
   2) LAYOUT: Define bounding rectangles
      for each metric (two center + four corners)
---------------------------------------------------- */

// Center rectangles for Overall Health Outcomes (BMI & SPH)
// Each rectangle is 80 px wide, with a 60 px gap in the middle
const centerBMI = {
  xMin: widthHC / 2 - 120,
  xMax: widthHC / 2 - 40,
  yMin: heightHC / 5,
  yMax: heightHC / 1.8
};

const centerSPH = {
  xMin: widthHC / 2 + 40,
  xMax: widthHC / 2 + 120,
  yMin: heightHC / 5,
  yMax: heightHC / 1.8
};


// Four corners
const cornerMargin = 30;
const rectWidth = 120;
const rectHeight = 200;

const topLeftRect = {
  xMin: cornerMargin + cornerMargin * 5,
  xMax: cornerMargin + rectWidth,
  yMin: heightHC / 5,
  yMax: rectHeight * 2 - 30
};

const topRightRect = {
  xMin: widthHC - cornerMargin - rectWidth * 3,
  xMax: widthHC - cornerMargin,
  yMin: heightHC / 5,
  yMax: rectHeight * 2 - 30
};

const bottomLeftRect = {
  xMin: cornerMargin + cornerMargin * 5,
  xMax: cornerMargin + rectWidth,
  yMin: heightHC / 1.6,
  yMax: heightHC - 20
};

const bottomRightRect = {
  xMin: widthHC - cornerMargin - rectWidth * 3,
  xMax: widthHC - cornerMargin,
  yMin: heightHC / 1.6,
  yMax: heightHC - 20
};


/* ---------------------------------------------------
   3) HELPER FUNCTIONS
---------------------------------------------------- */

function getFlagURL(countryName) {
  switch(countryName) {
    case "France": return "images/france.png";
    case "Italy": return "images/italy.png";
    case "Netherlands": return "images/netherlands.png";
    default: return "";
  }
}

function getCountryRanks(country, allMetrics) {
  // We want to see across 6 arrays: 
  //   bmiValues, sphValues, freqValues, vigorValues, fruitValues, vegValues
  // Each has 3 items: {country, value} sorted desc (largest first).
  let firstCount = 0, secondCount = 0, thirdCount = 0;

  allMetrics.forEach(metricArr => {
    // metricArr is sorted desc, so index 0 is 1st place, index 1 is 2nd, index 2 is 3rd
    if (metricArr[0].country === country) firstCount++;
    if (metricArr[1].country === country) secondCount++;
    if (metricArr[2].country === country) thirdCount++;
  });

  return { firstCount, secondCount, thirdCount };
}



function drawSectionHeading(x, y, label, className) {
  // Remove old heading if it exists
  svgHC.selectAll("text." + className).remove();

  // Append new heading
  svgHC.append("text")
    .attr("class", className)
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", "middle")
    .style("font-size", "30px")
    .style("font-weight", "bold")
    .text(label);
}


/**
 * Calculate a minimum radius so the text fits entirely
 * inside the circle without overflow.
 */
function computeMinRadiusForText(value, fontSize) {
  const textString = `${value.toFixed(1)}`;
  // Approximate width in pixels => # characters * (fontSize * 0.6)
  const approximateTextWidth = textString.length * fontSize * 0.6;
  return approximateTextWidth / 2 + 4;  // +4 px padding
}

// A) Place circles in a vertical stack (largest at bottom)
function placeCirclesVertically(values, rect, fontSize = 20) {
  const centerX = (rect.xMin + rect.xMax) / 2;
  let currentY = rect.yMax;
  const circles = [];

  for (let i = 0; i < values.length; i++) {
    const dataVal = values[i].value;

    // 2a) Get the radius from our global scale
    const rFromGlobalScale = circleSizeScale(dataVal);

    // 2b) Still ensure text fits inside the circle
    const rMinText = computeMinRadiusForText(dataVal, fontSize);
    const finalR = Math.max(rFromGlobalScale, rMinText);

    currentY -= finalR;
    circles.push({
      country: values[i].country,
      value: dataVal,
      x: centerX,
      y: currentY,
      r: finalR
    });
    currentY -= (finalR + 10);
  }
  return circles;
}

function drawCircles(circles, classPrefix, metricInfo, allMetrics) {
  //////////////////////////////////////////
  // 1) CIRCLES: ENTER-UPDATE-EXIT
  //////////////////////////////////////////
  const circleSelection = svgHC.selectAll("circle." + classPrefix)
    .data(circles, d => d.country);

  // EXIT
  circleSelection.exit()
    .transition().duration(600)
    .attr("r", 0)
    .remove();

  // ENTER
  const circleEnter = circleSelection.enter()
    .append("circle")
    .attr("class", classPrefix)
    .attr("fill", d => colorScaleHC(d.country))
    .attr("stroke", "#666")
    .attr("stroke-width", 1)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 0); // pop-in effect

  // ENTER + UPDATE (MERGE)
  const circleMerge = circleEnter.merge(circleSelection);

  // Transition for circle positions and sizes
  circleMerge
    .transition().duration(600)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r);

  // HOVER EVENTS (optional)
  circleMerge
  .on("mouseover", function (event, d) {
    // De-emphasize all circles, highlight hovered circle
    svgHC.selectAll("circle." + classPrefix)
      .transition().duration(200)
      .style("opacity", 0.2);

    d3.select(this)
      .transition().duration(200)
      .attr("r", d.r * 1.2)
      .attr("stroke-width", 3)
      .style("opacity", 1);

    // === TOOLTIP LOGIC ===
    // 1) Identify which metric we are in:
    const info = metricInfo[classPrefix];
    if (!info) return; // fallback if not defined

    // 2) Compute average
    const avg = info.getAvg(); // e.g. 60.0

    // 3) Compute how many times more/less
    let ratio = d.value / avg; // e.g. 1.2 means 20% higher than avg
    const timesString = ratio.toFixed(2) + "× " + (ratio >= 1 ? "more" : "less") + " than avg";

    // 4) Build tooltip HTML
    let tooltipHTML = `
      <span><strong>${d.country}</strong></span><br>
      <span>${info.label} <strong>${timesString}</strong></span><br>
      <br><br>
      <span> 💡 More about ${info.label}: <br> ${info.hoverText}</span>
    `;

    tooltipHC
      .style("visibility", "visible")
      .html(tooltipHTML)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY + 10) + "px");
  })
  .on("mousemove", function(event, d) {
    // Update tooltip position as mouse moves
    tooltipHC
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY + 10) + "px");
  })
  .on("mouseout", function (event, d) {
    // Return all circles to normal
    svgHC.selectAll("circle." + classPrefix)
      .transition().duration(200)
      .attr("r", c => c.r)
      .attr("stroke-width", 1)
      .style("opacity", 1);

    // Hide tooltip
    tooltipHC.style("visibility", "hidden");
  })
  .on("click", function(event, d) {
    if (selectedCountry === d.country) {
      selectedCountry = null;
    } else {
      selectedCountry = d.country;
    }
    highlightByCountry(selectedCountry);
  
    if (selectedCountry) {
      // 1) Show the flag
      svgHC.selectAll(".country-flag").remove(); 
      const flagURL = getFlagURL(selectedCountry);
  
      // Position below overall health outcomes
      const xFlag = (centerBMI.xMin + centerSPH.xMax)/2 - 150; // ~center, offset half width
      const yFlag = centerSPH.yMax + 40; // or some fixed position below
  
      svgHC.append("svg:image")
        .attr("class", "country-flag")
        .attr("xlink:href", flagURL)
        .attr("x", xFlag)
        .attr("y", yFlag)
        .attr("width", 300)
        .attr("height", 125);
  
      // 2) Show rank summary
      const { firstCount, secondCount, thirdCount } = getCountryRanks(selectedCountry, allMetrics);
  
      // Remove old text summary
      ///////////////////////////////////////////
// At the point where you show rank summary
///////////////////////////////////////////
svgHC.selectAll(".rank-summary").remove();

// Create a parent <text> element
const rankSummary = svgHC.append("text")
  .attr("class", "rank-summary")
  .attr("x", xFlag * 1.25)
  .attr("y", yFlag * 1.35)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .style("fill", "#444");       // a softer color than pure black

// 1) First line
rankSummary
  .append("tspan")
  .attr("x", xFlag * 1.25 + 5)  // re-assign x so each line is centered
  .attr("dy", "0")             // no vertical offset for the first line
  .style("font-weight", "bold")
  .text(`Ranked 1st across ${firstCount} categories`);

// 2) Second line
rankSummary
  .append("tspan")
  .attr("x", xFlag * 1.3 + 8)
  .attr("dy", "1.2em")         // move ~1.2 line-heights down
  .style("font-weight", "normal")
  .text(` 2nd across ${secondCount} categories`);

// 3) Third line
rankSummary
  .append("tspan")
  .attr("x", xFlag * 1.3 + 8)
  .attr("dy", "1.2em")
  .style("font-weight", "normal")
  .text(` 3rd across ${thirdCount} categories`);

  
    } else {
      // If we unselected the same country, remove the flag & summary
      svgHC.selectAll(".country-flag").remove();
      svgHC.selectAll(".rank-summary").remove();
    }
  });
  


  //////////////////////////////////////////
  // 2) TEXT LABELS: ENTER-UPDATE-EXIT
  //////////////////////////////////////////
  const textSelection = svgHC.selectAll("text." + classPrefix)
    .data(circles, d => d.country);

  // EXIT
  textSelection.exit().remove();

  // ENTER
  const textEnter = textSelection.enter()
    .append("text")
    .attr("class", classPrefix)
    // Start font-size at 0 if you want a pop-in effect, or just start at 12
    .attr("font-size", 12)
    .style("font-weight", "bold")
    .style("fill", "#fff")
    .attr("text-anchor", "middle")
    .attr("x", d => d.x)
    .attr("y", d => d.y);

  // ENTER + UPDATE (MERGE)
  textEnter.merge(textSelection)
    .transition().duration(600)
    .attr("x", d => d.x)
    .attr("y", d => d.y + 4)
    // --- KEY PART: dynamic font size ---
    .attr("font-size", d => {
      // e.g., 60% of the circle radius, with a minimum of 12 px
      const dynamicFont = d.r * 0.6;
      return Math.max(12, dynamicFont);
    })
    .text(d => d.value.toFixed(1));
}


function highlightByCountry(country) {
  // If no country is selected (country === null),
  // revert all circles/text to full opacity & normal stroke
  if (!country) {
    svgHC.selectAll("circle")
      .transition().duration(300)
      .style("opacity", 1)
      .attr("stroke-width", 1);

    svgHC.selectAll("text")
      .transition().duration(300)
      .style("opacity", 1);

    hideSidePanel();
    return;
  }

  // If we do have a country selected:
  svgHC.selectAll("circle")
    .transition().duration(100)
    .style("opacity", d => d.country === country ? 1 : 0.2)
    .attr("stroke-width", d => d.country === country ? 3 : 1);

  // Similarly dim text for other countries
  svgHC.selectAll("text.bmi-circles, text.sph-circles, text.freq-circles, text.vigor-circles, text.fruit-circles, text.veg-circles")
  .transition().duration(100)
  .style("opacity", d => d.country === country ? 1 : 0.2);


  // Show or update side panel with extra info
  showSidePanel(country);
}

function showSidePanel(country) {
  // Example: you have a <div id="sidePanel"></div> in HTML
  // You might fetch more data, or just display a quick summary
  d3.select("#sidePanel")
    .style("display", "block")
    .html(`
        <h3>${country}</h3>
        <p>Here are some additional stats or context for ${country}.</p>
      `);
}

function hideSidePanel() {
  d3.select("#sidePanel")
    .style("display", "none");
}



// C) Draw a label for a rectangle region
function drawRectTitle(rect, label, classPrefix) {
  // Remove old text
  svgHC.selectAll("text." + classPrefix).remove();

  // We split the label by newline, if any
  const lines = label.split("\n");

  // For each line in 'lines', we append a separate text element
  lines.forEach((lineText, i) => {
    svgHC.append("text")
      .attr("class", classPrefix)
      .attr("x", (rect.xMin + rect.xMax) / 2)
      .attr("y", rect.yMin - 5 + i * 15) // offset each line by ~15px
      .attr("text-anchor", "middle")
      .style("font-size", i === 0 ? "20px" : "18px")
      .style("font-weight", "normal")
      .text(lineText);
  });
}


/* ---------------------------------------------------
   4) DATA AGGREGATION FOR EACH METRIC
---------------------------------------------------- */

// Return array of { country, value } sorted desc by value
function getBmiData(year) {
  const filtered = sportsDataAll.filter(d => d.Year === year);
  return countries.map(c => ({
    country: c,
    value: filtered.find(d => d.Country === c)["Healthy (%)"]
  })).sort((a, b) => b.value - a.value);
}

function getSphData(year) {
  const filtered = sportsDataAll.filter(d => d.Year === year);
  return countries.map(c => ({
    country: c,
    value: filtered.find(d => d.Country === c)["SPH"]
  })).sort((a, b) => b.value - a.value);
}

function getExerciseFrequencyData(year) {
  // freq = Exercise Frequency (Regularly) + (Some Regularity)
  const filtered = sportsDataAll.filter(d => d.Year === year);
  return countries.map(c => {
    const row = filtered.find(d => d.Country === c);
    if (!row) return { country: c, value: 0 };
    const val = (+row["Exercise Frequency (Regularly)"] || 0) + (+row["Exercise Frequency (Some Regularity)"] || 0);
    return { country: c, value: val };
  }).sort((a, b) => b.value - a.value);
}

function getVigorousActivityData(year) {
  // 100 - Vigorous Activity (Never)
  const filtered = sportsDataAll.filter(d => d.Year === year);
  return countries.map(c => {
    const row = filtered.find(d => d.Country === c);
    if (!row) return { country: c, value: 0 };
    const val = 100 - (+row["Vigorous Activity (Never)"] || 0);
    return { country: c, value: val };
  }).sort((a, b) => b.value - a.value);
}

function getFruitData(year) {
  const filtered = healthDataAll.filter(d => d.Year === year && d.Sex === "Total");
  return countries.map(c => ({
    country: c,
    value: filtered.find(d => d.Country === c)["Fruit Consumption (%)"] || 0
  })).sort((a, b) => b.value - a.value);
}

function getVegetableData(year) {
  const filtered = healthDataAll.filter(d => d.Year === year && d.Sex === "Total");
  return countries.map(c => ({
    country: c,
    value: filtered.find(d => d.Country === c)["Vegetable Consumption (%)"] || 0
  })).sort((a, b) => b.value - a.value);
}

/* ---------------------------------------------------
   5) UPDATE FUNCTION
---------------------------------------------------- */
function updateAll(year) {
  // 1) Overall Health Outcomes
  const xOverall = (centerBMI.xMin + centerSPH.xMax) / 2;
  const yOverall = centerBMI.yMin - 70;
  drawSectionHeading(xOverall, yOverall, "Overall Health Outcomes", "overall-health-heading");

  // 2) Physical Activity
  const xPhys = (topLeftRect.xMin + topLeftRect.xMax) / 2;
  const yPhys = topLeftRect.yMin - 70;
  drawSectionHeading(xPhys, yPhys, "Physical Activity", "physical-activity-heading");

  // 3) Dietary Habits
  const xDiet = (topRightRect.xMin + topRightRect.xMax) / 2;
  const yDiet = topRightRect.yMin - 70;
  drawSectionHeading(xDiet, yDiet, "Dietary Habits", "dietary-habits-heading");

  // 1. Prepare each metric’s data as before:
  let bmiValues = getBmiData(year);
  let sphValues = getSphData(year);
  let freqValues = getExerciseFrequencyData(year);
  let vigorValues = getVigorousActivityData(year);
  let fruitValues = getFruitData(year);
  let vegValues = getVegetableData(year);
  let allMetrics = [bmiValues, sphValues, freqValues, vigorValues, fruitValues, vegValues];

    // Map each classPrefix to a descriptive message and a function
// that returns the "average" for that metric.
const metricInfo = {
  "bmi-circles": {
    label: "Healthy BMI",
    hoverText: "Perentage of students with a normal BMI between 18.5 and 24.9.",
    getAvg: () => {
      // For demonstration, suppose we store the average
      // from your data or compute it each time. For instance:
      let sum = 0, count = 0;
      // For the 'bmiValues' array in updateAll, sum their values:
      bmiValues.forEach(d => { sum += d.value; count++; });
      return count > 0 ? sum / count : 0;
    }
  },
  "sph-circles": {
    label: "Good SPH",
    hoverText: "Percentage of students that consider themselves healthy",
    getAvg: () => {
      let sum = 0, count = 0;
      sphValues.forEach(d => { sum += d.value; count++; });
      return count > 0 ? sum / count : 0;
    }
  },
  "freq-circles": {
    label: "Students Exercising Regularly",
    hoverText: "Percentage of students that exercise consistently.",
    getAvg: () => {
      let sum = 0, count = 0;
      freqValues.forEach(d => { sum += d.value; count++; });
      return count > 0 ? sum / count : 0;
    }
  },
  "vigor-circles": {
    label: "Students Exercising Rigorously",
    hoverText: "Percentage of students doing moderate or vigorous exercise regularly",
    getAvg: () => {
      let sum = 0, count = 0;
      vigorValues.forEach(d => { sum += d.value; count++; });
      return count > 0 ? sum / count : 0;
    }
  },
  "fruit-circles": {
    label: "Regular Fruit Eaters",
    hoverText: "Percentage of students maintaining a consistent supply of fruits in their daily diet.",
    getAvg: () => {
      let sum = 0, count = 0;
      fruitValues.forEach(d => { sum += d.value; count++; });
      return count > 0 ? sum / count : 0;
    }
  },
  "veg-circles": {
    label: "Regular Fruit Eaters",
    hoverText: "Percentage of students maintaining a consistent supply of veggies in their daily diet.",
    getAvg: () => {
      let sum = 0, count = 0;
      vegValues.forEach(d => { sum += d.value; count++; });
      return count > 0 ? sum / count : 0;
    }
  },
};

  const bmiCircles = placeCirclesVertically(bmiValues, centerBMI, 12);
  const sphCircles = placeCirclesVertically(sphValues, centerSPH, 12);
  const freqCircles = placeCirclesVertically(freqValues, topLeftRect, 12);
  const vigorCircles = placeCirclesVertically(vigorValues, bottomLeftRect, 12);
  const fruitCircles = placeCirclesVertically(fruitValues, topRightRect, 12);
  const vegCircles = placeCirclesVertically(vegValues, bottomRightRect, 12);

  drawCircles(bmiCircles, "bmi-circles", metricInfo, allMetrics);
  drawCircles(sphCircles, "sph-circles", metricInfo, allMetrics);
  drawCircles(freqCircles, "freq-circles", metricInfo, allMetrics);
  drawCircles(vigorCircles, "vigor-circles", metricInfo, allMetrics);
  drawCircles(fruitCircles, "fruit-circles", metricInfo, allMetrics);
  drawCircles(vegCircles, "veg-circles", metricInfo, allMetrics);

  // Titles, etc. remain the same
  drawRectTitle(centerBMI, "Healthy BMI", "bmi-title");
  drawRectTitle(centerSPH, "Good SPH", "sph-title");
  drawRectTitle(topLeftRect, "Students Exercising Regularly", "freq-title");
  drawRectTitle(topRightRect, "Regular Fruit Eaters", "fruit-title");
  drawRectTitle(bottomLeftRect, "Students Exercising Rigorously", "vigor-title");
  drawRectTitle(bottomRightRect, "Regular Veggie Eaters", "veg-title");
}

/* ---------------------------------------------------
   6) YEAR SLIDER
---------------------------------------------------- */
d3.select("#yearSlider").on("input", function () {
  const selectedYear = this.value;
  d3.select("#yearDisplay").text(selectedYear);
  updateAll(selectedYear);
});

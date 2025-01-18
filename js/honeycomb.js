const widthHC = 900;
const heightHC = 500;
let selectedCountry = null;

// Create SVG container
const svgHC = d3
  .select("#honeycomb")
  .append("svg")
  .attr("width", widthHC)
  .attr("height", heightHC);
//   .style("border", "1px solid #ccc")
// Add Title
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

// Color scale
const colorScaleHC = d3.scaleOrdinal()
  .domain(countries)
  .range(["rgb(0, 112, 192)", "rgb(0, 128, 0)", "rgb(255, 165, 0)"]);

/* ---------------------------------------------------
   1) LOAD DATA
---------------------------------------------------- */
d3.csv("data/health_data.csv").then(data => {
  healthDataAll = data;
  healthDataAll.forEach(d => {
    d.Year = d.Year;
    d.Country = d.Country;
    d.Sex = d.Sex;
    d["SPH"] = +d["SPH"];
    d["Healthy (%)"] = +d["Healthy (%)"];
    d["Fruit Consumption (%)"] = +d["Fruit Consumption (%)"];
    d["Vegetable Consumption (%)"] = +d["Vegetable Consumption (%)"];
  });
  if (sportsDataAll.length > 0) updateAll("2022");
});

d3.csv("data/sports_data.csv").then(data => {
  sportsDataAll = data;
  sportsDataAll.forEach(d => {
    d.Year = d.Year;
    d.Country = d.Country;
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
    yMax: heightHC / 1.6
  };
  
  const centerSPH = {
    xMin: widthHC / 2 + 40,  
    xMax: widthHC / 2 + 120,
    yMin: heightHC / 5,
    yMax: heightHC / 1.6
  };
  

// Four corners
const cornerMargin = 30;
const rectWidth = 120;
const rectHeight = 200;

const topLeftRect = {
  xMin: cornerMargin + cornerMargin * 5,
  xMax: cornerMargin + rectWidth,
  yMin: heightHC / 30,
  yMax: rectHeight + 30
};

const topRightRect = {
  xMin: widthHC - cornerMargin - rectWidth * 3,
  xMax: widthHC - cornerMargin,
  yMin: heightHC / 30,
  yMax: rectHeight + 30
};

const bottomLeftRect = {
  xMin: cornerMargin + cornerMargin * 5,
  xMax: cornerMargin + rectWidth,
  yMin: heightHC / 1.8,
  yMax: heightHC
};

const bottomRightRect = {
  xMin: widthHC - cornerMargin - rectWidth * 3,
  xMax: widthHC - cornerMargin,
  yMin: heightHC / 1.8,
  yMax: heightHC 
};

/* ---------------------------------------------------
   3) HELPER FUNCTIONS
---------------------------------------------------- */

/**
 * Calculate a minimum radius so the text fits entirely
 * inside the circle without overflow.
 */
function computeMinRadiusForText(value, fontSize) {
  // Example: if value = 57.3, text = "57.3%"
  const textString = `${value.toFixed(1)}%`;
  // Approximate width in pixels => # characters * (fontSize * 0.6)
  const approximateTextWidth = textString.length * fontSize * 0.6;
  return approximateTextWidth / 2 + 4;  // +4 px padding
}

// A) Place circles in a vertical stack (largest at bottom)
function placeCirclesVertically(values, scale, rect, fontSize = 12) {
  // values sorted in descending order by .value
  const centerX = (rect.xMin + rect.xMax) / 2;
  let currentY = rect.yMax; // start from bottom
  const circles = [];

  for (let i = 0; i < values.length; i++) {
    let dataVal = values[i].value;
    let rFromScale = scale(dataVal);

    // Ensure the circle is big enough for text
    let rMinText = computeMinRadiusForText(dataVal, fontSize);
    let finalR = Math.max(rFromScale, rMinText);

    currentY -= finalR; // move up by radius
    circles.push({
      country: values[i].country,
      value: dataVal,
      x: centerX,
      y: currentY,
      r: finalR
    });
    currentY -= (finalR + 10); // additional gap
  }
  return circles;
}

function drawCircles(circles, classPrefix) {
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
      .on("mouseover", function(event, d) {
        svgHC.selectAll("circle." + classPrefix)
          .transition().duration(200)
          .style("opacity", 0.2);
  
        d3.select(this)
          .transition().duration(200)
          .attr("r", d.r * 1.2)
          .attr("stroke-width", 3)
          .style("opacity", 1);
      })
      .on("mouseout", function(event, d) {
        svgHC.selectAll("circle." + classPrefix)
          .transition().duration(200)
          .attr("r", c => c.r)
          .attr("stroke-width", 1)
          .style("opacity", 1);
      })
      .on("click", function(event, d) {
        if (selectedCountry === d.country) {
          selectedCountry = null;
        } else {
          selectedCountry = d.country;
        }
        highlightByCountry(selectedCountry);
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
      .transition().duration(300)
      .style("opacity", d => d.country === country ? 1 : 0.2)
      .attr("stroke-width", d => d.country === country ? 3 : 1);
  
    // Similarly dim text for other countries
    svgHC.selectAll("text")
      .transition().duration(300)
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
        .style("font-size", i === 0 ? "14px" : "12px") // slightly smaller for sub-label
        .style("font-weight", i === 0 ? "bold" : "normal")
        .text(lineText);
    });
  }
  

/* ---------------------------------------------------
   4) DATA AGGREGATION FOR EACH METRIC
---------------------------------------------------- */

// Return array of { country, value } sorted desc by value
function getBmiData(year) {
  const filtered = healthDataAll.filter(d => d.Year === year && d.Sex === "Total");
  return countries.map(c => ({
    country: c,
    value: filtered.find(d => d.Country === c)["Healthy (%)"]
  })).sort((a, b) => b.value - a.value);
}

function getSphData(year) {
  const filtered = healthDataAll.filter(d => d.Year === year && d.Sex === "Total");
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
  // 1. BMI in center-left
  let bmiValues = getBmiData(year);
  // 2. SPH in center-right
  let sphValues = getSphData(year);
  // 3. top-left: Exercising Frequently
  let freqValues = getExerciseFrequencyData(year);
  // 4. top-right: Eating Fruits
  let fruitValues = getFruitData(year);
  // 5. bottom-left: Exercising Vigorously
  let vigorValues = getVigorousActivityData(year);
  // 6. bottom-right: Eating Vegetables
  let vegValues = getVegetableData(year);

  // If any dataset is empty or undefined, just skip
  if (!bmiValues.length || !sphValues.length) return;

  // Create scales for each variable
  const minR = 15, maxR = 35;

  const bmiExtent = d3.extent(bmiValues, d => d.value);
  const bmiScale = d3.scaleLinear().domain(bmiExtent).range([minR, maxR]);

  const sphExtent = d3.extent(sphValues, d => d.value);
  const sphScale = d3.scaleLinear().domain(sphExtent).range([minR, maxR]);

  const freqExtent = d3.extent(freqValues, d => d.value);
  const freqScale = d3.scaleLinear().domain(freqExtent).range([minR, maxR]);

  const vigorExtent = d3.extent(vigorValues, d => d.value);
  const vigorScale = d3.scaleLinear().domain(vigorExtent).range([minR, maxR]);

  const fruitExtent = d3.extent(fruitValues, d => d.value);
  const fruitScale = d3.scaleLinear().domain(fruitExtent).range([minR, maxR]);

  const vegExtent = d3.extent(vegValues, d => d.value);
  const vegScale = d3.scaleLinear().domain(vegExtent).range([minR, maxR]);

  // 2) Place circles vertically in each rectangle
  // Note we pass fontSize=12 to match the text
  const bmiCircles = placeCirclesVertically(bmiValues, bmiScale, centerBMI, 12);
  drawCircles(bmiCircles, "bmi-circles");

  const sphCircles = placeCirclesVertically(sphValues, sphScale, centerSPH, 12);
  drawCircles(sphCircles, "sph-circles");

  const freqCircles = placeCirclesVertically(freqValues, freqScale, topLeftRect, 12);
  drawCircles(freqCircles, "freq-circles");

  const fruitCircles = placeCirclesVertically(fruitValues, fruitScale, topRightRect, 12);
  drawCircles(fruitCircles, "fruit-circles");

  const vigorCircles = placeCirclesVertically(vigorValues, vigorScale, bottomLeftRect, 12);
  drawCircles(vigorCircles, "vigor-circles");

  const vegCircles = placeCirclesVertically(vegValues, vegScale, bottomRightRect, 12);
  drawCircles(vegCircles, "veg-circles");

  drawRectTitle(centerBMI, "Normal BMI (%)", "bmi-title");
drawRectTitle(centerSPH, "Good SPH (%)", "sph-title");
drawRectTitle(topLeftRect, "Frequent Exercise (%)\n(Students Exercising Most Days)", "freq-title");
drawRectTitle(topRightRect, "Fruit Consumption (%)\n(Regular Fruit Eaters)", "fruit-title");
drawRectTitle(bottomLeftRect, "Vigorous Exercise (%)\n(Students Who Do High-Intensity Workouts)", "vigor-title");
drawRectTitle(bottomRightRect, "Vegetable Consumption (%)\n(Regular Veggie Eaters)", "veg-title");

}

/* ---------------------------------------------------
   6) YEAR SLIDER
---------------------------------------------------- */
d3.select("#yearSlider").on("input", function () {
  const selectedYear = this.value;
  d3.select("#yearDisplay").text(selectedYear);
  updateAll(selectedYear);
});

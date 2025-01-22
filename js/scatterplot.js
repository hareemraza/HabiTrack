const margin = { top: 60, right: 60, bottom: 100, left: 120 };
const width = 1300 - margin.left - margin.right;
const height = 650 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right + 220)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

svg
  .append("line")
  .attr("x1", width / 2)
  .attr("x2", width / 2)
  .attr("y1", 0)
  .attr("y2", height)
  .style("stroke", "gray")
  .style("stroke-dasharray", "6");

// Scales for axes
const xScaleHealthy = d3.scaleLinear().range([0, width / 2 - 20]);
const xScaleSPH = d3.scaleLinear().range([width / 2 + 20, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Scales for countries
const colorScale = d3.scaleOrdinal()
  .domain(["France", "Italy", "Netherlands"])
  .range(["rgb(0, 112, 192)", "rgb(0, 128, 0)", "rgb(255, 165, 0)"]);

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "5px")
  .style("border-radius", "5px")
  .style("display", "none")
  .style("pointer-events", "none");

const yAxisSelect = d3.select("#y-axis-select");

// Map for dropdown names
const columnNameMap = {
  "Daily Fruit Consumption": "Fruit Consumption (%)",
  "Daily Vegetable Consumption": "Vegetable Consumption (%)",
  "Regular Sports and Exercise": "Exercise Frequency (Regularly)",
  "Somewhat Regular Sports and Exercise": "Exercise Frequency (Some Regularity)",
  "No Sports and Exercise": "Exercise Frequency (Never)",
  "Daily Moderate Activity (< 60 min)": "Moderate Activity (< 60 min)",
  "Daily Moderate Activity (> 60 min)": "Moderate Activity (> 60 min)",
  "No Moderate Activity": "Moderate Activity (Never)",
  "Daily Vigorous Activity (< 60 min)": "Vigorous Activity (< 60 min)",
  "Daily Vigorous Activity (> 60 min)": "Vigorous Activity (> 60 min)",
  "No Vigorous Activity": "Vigorous Activity (Never)",
  "Good Self-Perceived Health (SPH)": "SPH",
  "Healthy BMI": "Healthy (%)",
  "Obese BMI": "Obese (%)",
  "Overweight BMI": "Overweight (%)",
  "Overweight or Obese BMI": "Overweight or Obese (%)",
};

// Map for axes labels
const displayLabelMap = {
  "Fruit Consumption (%)": "Proportion of Students Consuming Fruits Daily (%)",
  "Vegetable Consumption (%)": "Proportion of Students Consuming Vegetables Daily (%)",
  "Exercise Frequency (Regularly)": "Proportion of Students who Exercise Regularly (%)",
  "Exercise Frequency (Some Regularity)": "Proportion of Students who Exercise with Some Regularity (%)",
  "Exercise Frequency (Never)": "Proportion of Students who Never Exercise (%)",
  "Moderate Activity (< 60 min)": "Proportion of Students with <60min of Daily Moderate Activity (%)",
  "Moderate Activity (> 60 min)": "Proportion of Students with >60min of Daily Moderate Activity (%)",
  "Moderate Activity (Never)": "Proportion of Students with No Daily Moderate Activity (%)",
  "Vigorous Activity (< 60 min)": "Proportion of Students with <60min of Vigorous Activity (%)",
  "Vigorous Activity (> 60 min)": "Proportion of Students with >60min of Vigorous Activity (%)",
  "Vigorous Activity (Never)": "Proportion of Students with No Daily Vigorous Activity (%)",
  "SPH": "Proportion of Student with Good SPH (%)",
  "Healthy (%)": "Proportion of Students with Healthy BMI (%)",
  "Obese (%)": "Proportion of Students who are Obese (%)",
  "Overweight (%)": "Proportion of Students who are Overweight (%)",
  "Overweight or Obese (%)": "Proportion of Students who are Overweight or Obese (%)",
};

// Categories in the dropdown
const categories = {
  "Dietary Habits": [
    "Daily Fruit Consumption", 
    "Daily Vegetable Consumption"
  ],
  "Physical Habits": [
    "Regular Sports and Exercise",
    "Somewhat Regular Sports and Exercise",
    "No Sports and Exercise",
    "Daily Moderate Activity (> 60 min)",
    "Daily Moderate Activity (< 60 min)",
    "No Moderate Activity",
    "Daily Vigorous Activity (> 60 min)",
    "Daily Vigorous Activity (< 60 min)",
    "No Vigorous Activity"
  ],
  "Health Metrics": [
    "Good Self-Perceived Health (SPH)",
    "Healthy BMI",
    "Obese BMI",
    "Overweight BMI",
    "Overweight or Obese BMI"
  ]
};

let defaultOption = "Daily Fruit Consumption";
for (const [category, options] of Object.entries(categories)) {
  const optgroup = yAxisSelect.append("optgroup").attr("label", category);
  options.forEach(option => {
    const optionElement = optgroup
      .append("option")
      .attr("value", option)
      .text(option);
    if (option === defaultOption) {
      optionElement.attr("selected", "selected");
    }
  });
}

let currentYAxisVariable = columnNameMap[defaultOption];

yAxisSelect.on("change", function () {
  const selectedDisplayName = this.value;
  currentYAxisVariable = columnNameMap[selectedDisplayName];
  updateScales();
  updatePlot(currentYAxisVariable);
});

// SVGs for Male and Female icon
const defs = svg.append("defs");
defs.append("symbol")
  .attr("id", "symbol-male")
  .attr("viewBox", "-96 0 512 512")
  .append("path")
  .attr("d", "M160 0c35.34 0 64 28.65 64 64s-28.65 64-64 64-64-28.65-64-64 28.65-64 64-64zM80 197.65v291.37c0 13.4 5.98 22.98 19.4 22.98h25.2c13.42 0 19.4-9.56 19.4-22.98V353.91h32v135.11c0 13.42 5.98 22.98 19.4 22.98h25.2c13.42 0 19.4-9.58 19.4-22.98V197.65h21.64c7.97 0 10.36 15.6 10.36 20.52V312c0 13.2 10.8 24 24 24s24-10.8 24-24V198c0-28-26-54-54-54H54c-28 0-54 26-54 54v114c0 13.2 10.8 24 24 24s24-10.8 24-24v-93.83c0-4.92 2.39-20.52 10.36-20.52H80z")
  .attr("fill", "currentColor");
defs.append("symbol")
  .attr("id", "symbol-female")
  .attr("viewBox", "-96 0 512 512")
  .append("path")
  .attr("d", "M160 0c35.34 0 64 28.65 64 64s-28.65 64-64 64-64-28.65-64-64 28.65-64 64-64zM96 144c-21.45 0-50.77 12.58-57.98 34.38L1.31 288.5c-4.14 12.53 2.66 26.05 15.19 30.19 12.53 4.14 26.04-2.66 30.19-15.19 10.32-30.98 20.65-61.96 30.98-92.94C81.77 198.27 87.95 192.97 96 192c0 23.69 8.45 46.81 16 58v6l-48.08 96.15C48 384 48 384 80 384h32v96c0 18.35 13.96 31.46 32 32h32c18.04-.54 32-13.65 32-32v-96h32c32 0 32 0 16.08-31.85L208 256v-6c7.55-11.19 16-34.31 16-58 8.05.97 14.23 6.27 18.33 18.56 10.33 30.98 20.66 61.96 30.98 92.94 4.15 12.53 17.66 19.33 30.19 15.19 12.53-4.14 19.33-17.66 15.19-30.19l-36.71-110.12C274.77 156.58 245.45 144 224 144H96z")
  .attr("fill", "currentColor");

colorScale.domain().forEach(country => {
  const baseColor = d3.rgb(colorScale(country));
  const gradId = `gradient-${country.replace(/\s+/g, '-')}`;
  const countryGrad = defs.append("linearGradient")
    .attr("id", gradId)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");
  countryGrad.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", baseColor.brighter(1.5));
  countryGrad.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", baseColor.darker(0.5));
});

// Legends
const legendGroup = svg.append("g")
  .attr("class", "legends")
  .attr("transform", `translate(${width + margin.right}, 0)`);

let legendYPos = 0;
const legendSpacing = 60;
const legendTitleFont = "18px";
const legendLabelFont = "17px";

// Default toggles
let showTrendlines = false;
let viewComparison = true; 

// Trendline Toggle
const trendlineToggleGroup = legendGroup.append("g")
  .attr("class", "trendline-toggle")
  .attr("transform", `translate(0, ${legendYPos})`);

trendlineToggleGroup.append("foreignObject")
  .attr("x", -10)
  .attr("y", 0)
  .attr("width", 200)
  .attr("height", 30)
  .html(`
    <style>
      .checkbox-container {
        display: flex;
        align-items: center;
        font-family: Roboto;
        font-size: 12px;
        color: #333;
      }
      .checkbox-container input {
        width: 14px;
        height: 14px;
        margin-right: 8px;
        cursor: pointer;
      }
      .checkbox-container label {
        margin: 0;
        cursor: pointer;
      }
    </style>
    <div class="checkbox-container">
      <input type="checkbox" id="trendline-toggle">
      <label for="trendline-toggle">Show Trendlines</label>
    </div>
  `);

legendYPos += 20;

// Scaled Axes Toggle
const comparisonToggleGroup = legendGroup.append("g")
  .attr("class", "comparison-toggle")
  .attr("transform", `translate(0, ${legendYPos})`);

comparisonToggleGroup.append("foreignObject")
  .attr("x", -10)
  .attr("y", 0)
  .attr("width", 200)
  .attr("height", 30)
  .html(`
    <style>
      .checkbox-container {
        display: flex;
        align-items: center;
        font-family: Roboto;
        font-size: 12px;
        color: #333;
      }
      .checkbox-container input {
        width: 14px;
        height: 14px;
        margin-right: 8px;
        cursor: pointer;
      }
      .checkbox-container label {
        margin: 0;
        cursor: pointer;
      }
    </style>
    <div class="checkbox-container">
      <input type="checkbox" id="comparison-toggle" checked>
      <label for="comparison-toggle">Compare Scaled Axes</label>
    </div>
  `);

legendYPos += legendSpacing;

const countryLegend = legendGroup.append("g")
  .attr("class", "country-legend")
  .attr("transform", `translate(0, ${legendYPos})`);

countryLegend.append("text")
  .style("font-family", "Roboto")
  .style("font-size", legendTitleFont)
  .style("font-weight", "bold")
  .text("Country");

countryLegend.selectAll("rect.country-color")
  .data(colorScale.domain())
  .enter()
  .append("rect")
  .attr("class", "country-color")
  .attr("x", 0)
  .attr("y", (d, i) => 10 + i * 20)
  .attr("width", 20)
  .attr("height", 10)
  .attr("rx", 3)
  .attr("ry", 3)
  .style("fill", d => `url(#gradient-${d.replace(/\s+/g,'-')})`);

countryLegend.selectAll("text.country-label")
  .data(colorScale.domain())
  .enter()
  .append("text")
  .attr("class", "country-label")
  .attr("x", 30)
  .attr("y", (d, i) => 10 + i * 20 + 8)
  .style("font-family", "Roboto")
  .style("font-size", legendLabelFont)
  .style("font-weight", "normal")
  .attr("alignment-baseline", "middle")
  .text(d => d);

legendYPos += 40 + legendSpacing;

const yearGradientLegend = legendGroup.append("g")
  .attr("class", "year-gradient-legend")
  .attr("transform", `translate(0, ${legendYPos})`);

const gradWidth = 100;
const gradHeight = 10;
const gradSpacing = 25;

yearGradientLegend.append("text")
  .style("font-family", "Roboto")
  .style("font-size", legendTitleFont)
  .style("font-weight", "bold")
  .text("Year");

const yearAxisGroup = yearGradientLegend.append("g");
const yearCaption = yearGradientLegend.append("text")
  .style("font-family", "Roboto")
  .style("font-size", "12px")
  .style("font-weight", "normal")
  .attr("text-anchor", "middle");

let genderLegendYPos = legendYPos; 
const genderLegend = legendGroup.append("g")
  .attr("class", "gender-legend")
  .style("display", "none");

const xAxisHealthyG = svg
  .append("g")
  .attr("transform", `translate(0, ${height})`)
  .attr("class", "x-axis-healthy");

const xAxisSPHG = svg
  .append("g")
  .attr("transform", `translate(0, ${height})`)
  .attr("class", "x-axis-sph");

const yAxis = svg
  .append("g")
  .attr("class", "y-axis");

svg
  .append("text")
  .attr("x", width / 4)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .style("font-family", "Roboto")
  .style("font-size", "18px")
  .style("font-weight", "400")
  .style("fill", "black")
  .text("Proportion of Students with Healthy BMI (%)");

svg
  .append("text")
  .attr("x", (width * 3) / 4)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .style("font-family", "Roboto")
  .style("font-size", "18px")
  .style("font-weight", "400")
  .style("fill", "black")
  .text("Proportion of Students with Good SPH (%)");

const yAxisLabel = svg
  .append("text")
  .attr("class", "y-axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -70)
  .attr("dy", "1em")
  .attr("text-anchor", "middle")
  .style("font-family", "Roboto")
  .style("font-size", "18px")
  .style("font-weight", "400")
  .style("fill", "black");

let healthData, sportsData, allData;
let healthyExtent, sphExtent, yearExtent;

Promise.all([
  d3.csv("data/health_data.csv"),
  d3.csv("data/sports_data.csv"),
]).then(([hData, sData]) => {
  hData.forEach(d => {
    d["Healthy (%)"] = +d["Healthy (%)"];
    d.SPH = +d.SPH;
    d["Vegetable Consumption (%)"] = +d["Vegetable Consumption (%)"];
    d["Fruit Consumption (%)"] = +d["Fruit Consumption (%)"];
    if ("Overweight (%)" in d) d["Overweight (%)"] = +d["Overweight (%)"];
    if ("Obese (%)" in d) d["Obese (%)"] = +d["Obese (%)"];
    d.Sex = d.Sex ? d.Sex.trim() : "Unknown";
  });

  healthData = hData.filter(d => d.Sex !== "Total");

  sData.forEach(d => {
    [
      "SPH",
      "Overweight (%)",
      "Obese (%)",
      "Overweight or Obese (%)",
      "Healthy (%)",
      "Exercise Frequency (Regularly)",
      "Exercise Frequency (Some Regularity)",
      "Exercise Frequency (Never)",
      "Moderate Activity (> 60 min)",
      "Moderate Activity (< 60 min)",
      "Moderate Activity (Never)",
      "Vigorous Activity (> 60 min)",
      "Vigorous Activity (< 60 min)",
      "Vigorous Activity (Never)"
    ].forEach(field => {
      if (field in d) d[field] = +d[field];
    });
  });

  sportsData = sData;
  allData = [...healthData, ...sportsData];

  console.log("Health Data:", healthData);
  console.log("Sports Data:", sportsData);
  console.log("All Data:", allData);

  healthyExtent = d3.extent(allData, d => d["Healthy (%)"]);
  sphExtent = d3.extent(allData, d => d.SPH);
  yearExtent = d3.extent(allData, d => +d.Year);

  const yearLegendScale = d3.scaleLinear()
    .domain(yearExtent)
    .range([0, gradWidth]);

  const yearAxisUpdated = d3.axisBottom(yearLegendScale)
    .tickValues([yearExtent[0], yearExtent[1]])
    .tickFormat(d3.format("d"));

  const countriesForYearLegend = colorScale.domain();
  yearGradientLegend.selectAll(".year-gradient-row").remove();

  countriesForYearLegend.forEach((country, i) => {
    const gradId = `year-gradient-${country.replace(/\s+/g, '-')}`;
    const baseColor = d3.rgb(colorScale(country));
    const yearGrad = defs.append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
  });

  updateScales();

  countriesForYearLegend.forEach((country, i) => {
    const gradId = `year-gradient-${country.replace(/\s+/g, '-')}`;
    const legendRow = yearGradientLegend.append("g")
      .attr("class", "year-gradient-row")
      .attr("transform", `translate(0, ${10 + i*(gradHeight + gradSpacing)})`);

    legendRow.append("rect")
      .attr("width", gradWidth)
      .attr("height", gradHeight)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", `url(#${gradId})`);

    legendRow.append("text")
      .attr("x", gradWidth + 10)
      .attr("y", gradHeight/2)
      .attr("alignment-baseline", "middle")
      .style("font-family", "Roboto")
      .style("font-size", "12px")
      .style("font-weight", "normal")
      .text(country);
  });

  const totalHeight = 10 + (countriesForYearLegend.length * (gradHeight + gradSpacing)) - gradSpacing;
  yearAxisGroup
    .attr("transform", `translate(0, ${totalHeight + gradHeight + 10})`)
    .call(yearAxisUpdated);

  yearCaption
    .attr("x", gradWidth / 2)
    .attr("y", totalHeight + gradHeight + 40);

  updatePlot(currentYAxisVariable);

  const trendlineCheckbox = d3.select("#trendline-toggle");
  trendlineCheckbox.on("change", () => {
    showTrendlines = trendlineCheckbox.property("checked");
    svg.selectAll(".trendline-healthy").style("display", showTrendlines ? null : "none");
    svg.selectAll(".trendline-sph").style("display", showTrendlines ? null : "none");
  });

  const comparisonCheckbox = d3.select("#comparison-toggle");
  comparisonCheckbox.on("change", () => {
    viewComparison = comparisonCheckbox.property("checked");
    updateScales();
    updatePlot(currentYAxisVariable);
  });
});

const yearColorScales = {};

function updateScales() {
  if (!allData) return;
  colorScale.domain().forEach(country => {
    const baseColor = d3.rgb(colorScale(country));
    yearColorScales[country] = d3.scaleLinear()
      .domain(yearExtent)
      .range([baseColor.brighter(1.25), baseColor.darker(0.5)]);
  });

  if (viewComparison) {
    const minVal = Math.min(healthyExtent[0], sphExtent[0]);
    const maxVal = Math.max(healthyExtent[1], sphExtent[1]);
    xScaleHealthy.domain([minVal, maxVal]).nice();
    xScaleSPH.domain([minVal, maxVal]).nice();
  } else {
    xScaleHealthy.domain(healthyExtent).nice();
    xScaleSPH.domain(sphExtent).nice();
  }

  xAxisHealthyG.call(d3.axisBottom(xScaleHealthy).ticks(6));
  xAxisSPHG.call(d3.axisBottom(xScaleSPH).ticks(6));

  xAxisHealthyG.selectAll("text").style("font-size","14px");
  xAxisSPHG.selectAll("text").style("font-size","14px");

  colorScale.domain().forEach(country => {
    const gradId = `year-gradient-${country.replace(/\s+/g, '-')}`;
    const yearGrad = d3.select(`#${gradId}`);
    yearGrad.selectAll("stop").remove();
    yearGrad.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", yearColorScales[country](yearExtent[0]));
    yearGrad.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", yearColorScales[country](yearExtent[1]));
  });
}

function drawTrendlines(filteredData, xScale, yScale, isLeftPanel, xAccessor, yAccessor, dataType) {
  if (!filteredData || filteredData.length === 0) return;

  // For health data: group by (Country, Sex). For sports data: group by Country only.
  if (dataType === "health") {
    const grouped = d3.group(filteredData, d => d.Country, d => d.Sex);
    grouped.forEach((sexMap, country) => {
      sexMap.forEach((data, sex) => {
        const { slope, intercept } = calculateTrendline(data, xAccessor, yAccessor);
        const xExtent = d3.extent(data, xAccessor);
        const trendlinePoints = [
          { x: xExtent[0], y: slope * xExtent[0] + intercept },
          { x: xExtent[1], y: slope * xExtent[1] + intercept }
        ];

        svg.append("path")
          .datum(trendlinePoints)
          .attr("class", isLeftPanel ? "trendline-healthy" : "trendline-sph")
          .attr("data-country", country)
          .attr("data-sex", sex)
          .attr("fill", "none")
          .attr("stroke", colorScale(country))
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3")
          .attr("d", d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
          )
          .style("display", showTrendlines ? null : "none");
      });
    });
  } else {
    // Sports data remains as a single trendline per country
    const countries = d3.group(filteredData, d => d.Country);
    countries.forEach((data, country) => {
      const { slope, intercept } = calculateTrendline(data, xAccessor, yAccessor);
      const xExtent = d3.extent(data, xAccessor);
      const trendlinePoints = [
        { x: xExtent[0], y: slope * xExtent[0] + intercept },
        { x: xExtent[1], y: slope * xExtent[1] + intercept }
      ];

      svg.append("path")
        .datum(trendlinePoints)
        .attr("class", isLeftPanel ? "trendline-healthy" : "trendline-sph")
        .attr("data-country", country)
        .attr("fill", "none")
        .attr("stroke", colorScale(country))
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3")
        .attr("d", d3.line()
          .x(d => xScale(d.x))
          .y(d => yScale(d.y))
        )
        .style("display", showTrendlines ? null : "none");
    });
  }
}

function calculateTrendline(data, xAccessor, yAccessor) {
  const xValues = data.map(xAccessor);
  const yValues = data.map(yAccessor);
  const n = xValues.length;
  const sumX = d3.sum(xValues);
  const sumY = d3.sum(yValues);
  const sumXY = d3.sum(xValues.map((x, i) => x * yValues[i]));
  const sumXX = d3.sum(xValues.map(x => x * x));
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function highlightCountry(country) {
  svg.selectAll(".dot-healthy, .dot-sph, .trendline-healthy, .trendline-sph")
    .transition()
    .duration(200)
    .style("opacity", 0.1);
  svg.selectAll(`.dot-healthy[data-country='${country}'], .dot-sph[data-country='${country}']`)
    .transition()
    .duration(200)
    .style("opacity", 1);
  svg.selectAll(`.trendline-healthy[data-country='${country}'], .trendline-sph[data-country='${country}']`)
    .transition()
    .duration(200)
    .style("opacity", 1);
}

function unhighlightCountry() {
  svg.selectAll(".dot-healthy, .dot-sph, .trendline-healthy, .trendline-sph")
    .transition()
    .duration(200)
    .style("opacity", 1);
}

function updatePlot(yAxisVariable) {
  if (!allData) return;
  svg.selectAll(".dot-healthy").remove();
  svg.selectAll(".dot-sph").remove();
  svg.selectAll(".trendline-healthy").remove();
  svg.selectAll(".trendline-sph").remove();

  const displayYAxisLabel = displayLabelMap[yAxisVariable] || yAxisVariable;
  yAxisLabel.text(displayYAxisLabel);

  let isHealthData = categories["Health Metrics"].includes(
    Object.keys(columnNameMap).find(key => columnNameMap[key] === yAxisVariable)
  ) || categories["Dietary Habits"].includes(
    Object.keys(columnNameMap).find(key => columnNameMap[key] === yAxisVariable)
  );

  let isSportsData = categories["Physical Habits"].includes(
    Object.keys(columnNameMap).find(key => columnNameMap[key] === yAxisVariable)
  );

  let filteredData;
  if (isHealthData) {
    filteredData = healthData.filter(d => d[yAxisVariable] != null)
      .map(d => ({ ...d, Sex: d.Sex || "Unknown" }));
  } else if (isSportsData) {
    filteredData = sportsData.map(d => ({
      Country: d.Country,
      Year: d.Year,
      SPH: d.SPH,
      "Healthy (%)": d["Healthy (%)"],
      [yAxisVariable]: d[yAxisVariable]
    }));
  }

  if (!filteredData || filteredData.length === 0) return;

  const yAccessor = d => d[yAxisVariable];
  yScale.domain(d3.extent(filteredData, yAccessor)).nice();
  yAxis.transition().duration(1000).call(d3.axisLeft(yScale).ticks(6));
  yAxis.selectAll("text").style("font-size","14px");

  function drawPoint(selection, xAccessorFn, yAccessorFn, isLeftPanel, dataType) {
    if (dataType === "health") {
      selection
        .join("use")
        .attr("class", isLeftPanel ? "dot-healthy" : "dot-sph")
        .attr("data-country", d => d.Country)
        .attr("xlink:href", d => {
          if (d.Sex === "Male") return "#symbol-male";
          if (d.Sex === "Female") return "#symbol-female";
          return "#symbol-female";
        })
        .attr("x", d => isLeftPanel ? xScaleHealthy(d["Healthy (%)"]) : xScaleSPH(d.SPH))
        .attr("y", d => yScale(yAccessorFn(d)))
        .attr("width", 20)
        .attr("height", 20)
        .style("color", d => yearColorScales[d.Country](+d.Year))
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .html(
              `<strong>Country:</strong> ${d.Country}<br>
               <strong>Year:</strong> ${d.Year}<br>
               <strong>${isLeftPanel ? "Healthy BMI (%)" : "SPH"}:</strong> ${isLeftPanel ? d["Healthy (%)"] : d.SPH}<br>
               <strong>${displayYAxisLabel}:</strong> ${yAccessorFn(d)}<br>
               <strong>Sex:</strong> ${d.Sex}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
          highlightCountry(d.Country);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
          unhighlightCountry();
        });
    } else if (dataType === "sports") {
      selection
        .join("circle")
        .attr("class", isLeftPanel ? "dot-healthy" : "dot-sph")
        .attr("data-country", d => d.Country)
        .attr("cx", d => isLeftPanel ? xScaleHealthy(d["Healthy (%)"]) : xScaleSPH(d.SPH))
        .attr("cy", d => yScale(yAccessorFn(d)))
        .attr("r", 5)
        .attr("fill", d => yearColorScales[d.Country](+d.Year))
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .html(
              `<strong>Country:</strong> ${d.Country}<br>
               <strong>Year:</strong> ${d.Year}<br>
               <strong>${isLeftPanel ? "Healthy BMI (%)" : "SPH"}:</strong> ${isLeftPanel ? d["Healthy (%)"] : d.SPH}<br>
               <strong>${displayYAxisLabel}:</strong> ${yAccessorFn(d)}<br>
               <strong>Sex:</strong> Both`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
          highlightCountry(d.Country);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
          unhighlightCountry();
        });
    }
  }

  if (isHealthData) {
    svg.selectAll(".dot-healthy")
      .data(filteredData)
      .call(drawPoint, d => xScaleHealthy(d["Healthy (%)"]), yAccessor, true, "health");
    svg.selectAll(".dot-sph")
      .data(filteredData)
      .call(drawPoint, d => xScaleSPH(d.SPH), yAccessor, false, "health");
  } else if (isSportsData) {
    svg.selectAll(".dot-healthy")
      .data(filteredData)
      .call(drawPoint, d => xScaleHealthy(d["Healthy (%)"]), yAccessor, true, "sports");
    svg.selectAll(".dot-sph")
      .data(filteredData)
      .call(drawPoint, d => xScaleSPH(d.SPH), yAccessor, false, "sports");
  }

  // Pass dataType to drawTrendlines to separate by gender in health data, single line in sports.
  if (isHealthData || isSportsData) {
    drawTrendlines(
      filteredData,
      xScaleHealthy,
      yScale,
      true,
      d => d["Healthy (%)"],
      yAccessor,
      isHealthData ? "health" : "sports"
    );
    drawTrendlines(
      filteredData,
      xScaleSPH,
      yScale,
      false,
      d => d.SPH,
      yAccessor,
      isHealthData ? "health" : "sports"
    );
  }

  if (isHealthData) {
    genderLegend.style("display", "block");
    const numCountries = colorScale.domain().length;
    const totalHeightForYear = 10 + (numCountries * (gradHeight + 25)) - 25;
    const yearLegendTotalHeight = totalHeightForYear + gradHeight + 10 + 40;
    genderLegend.attr("transform", `translate(0, ${legendYPos + yearLegendTotalHeight + 30})`);
    genderLegend.selectAll("*").remove();
    genderLegend.append("text")
      .style("font-family", "Roboto")
      .style("font-size", legendTitleFont)
      .style("font-weight", "bold")
      .text("Gender");
    const gendersLegend = [
      { symbol: "♂", label: "Male" },
      { symbol: "♀", label: "Female" },
    ];
    genderLegend.selectAll("use.gender-symbol")
      .data(gendersLegend)
      .enter()
      .append("use")
      .attr("class", "gender-symbol")
      .attr("xlink:href", d => d.symbol === "♂" ? "#symbol-male" : "#symbol-female")
      .attr("x", 0)
      .attr("y", (d, i) => 10 + i * 20)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "black");
    genderLegend.selectAll("text.gender-label")
      .data(gendersLegend)
      .enter()
      .append("text")
      .attr("class", "gender-label")
      .attr("x", 30)
      .attr("y", (d, i) => 10 + i * 20 + 8)
      .style("font-family", "Roboto")
      .style("font-size", legendLabelFont)
      .style("font-weight", "normal")
      .attr("alignment-baseline", "middle")
      .text(d => d.label);
  } else {
    genderLegend.style("display", "none");
  }
}

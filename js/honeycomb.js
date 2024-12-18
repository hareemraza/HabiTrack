const widthHC = 900;
const heightHC = 700;

// Create SVG container
const svgHC = d3
    .select("#honeycomb")
    .append("svg")
    .attr("width", widthHC)
    .attr("height", heightHC);

// Add Title
svgHC
    .append("text")
    .attr("x", widthHC / 2)
    .attr("y", 50) // Corrected the y value
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Overall Health Outcomes");

// Create a single elongated hexagon in the center
const hexagonPoints = (cx, cy, width, height) => {
    const w = width / 2;
    const h = height / 2;
    return [
        [cx - w, cy],
        [cx - w / 2, cy - h],
        [cx + w / 2, cy - h],
        [cx + w, cy],
        [cx + w / 2, cy + h],
        [cx - w / 2, cy + h]
    ];
};

const mainHexCenterX = widthHC / 2;
const mainHexCenterY = heightHC / 2;
const mainHex = hexagonPoints(mainHexCenterX, mainHexCenterY, 800 - 300, 400 - 250);

svgHC.append("polygon")
    .attr("points", mainHex.map(d => d.join(",")).join(" "))
    .attr("fill", "#f9f9f9")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 2);

// Add vertical divider aligned with the hexagon's top and bottom
svgHC.append("line")
    .attr("x1", widthHC / 2)
    .attr("y1", mainHex[1][1]) // Top of the hexagon
    .attr("x2", widthHC / 2)
    .attr("y2", mainHex[4][1]) // Bottom of the hexagon
    .attr("stroke", "#ccc")
    .attr("stroke-width", 2);

// Add section titles
svgHC.append("text")
    .attr("x", mainHex[1][0] + 50)
    .attr("y", mainHex[1][1] + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("% Good BMI");

svgHC.append("text")
    .attr("x", widthHC / 2 + 70)
    .attr("y", mainHex[1][1] + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("% Good SPH");

let healthDataAll = [];
let sportsDataAll = [];
const countries = ["France", "Italy", "Netherlands"];

// Load Health Data
d3.csv("data/health_data.csv").then(data => {
    healthDataAll = data;
    healthDataAll.forEach(d => {
        d["SPH"] = +d["SPH"];
        d["Healthy (%)"] = +d["Healthy (%)"];
        d["Fruit Consumption (%)"] = +d["Fruit Consumption (%)"];
        d["Vegetable Consumption (%)"] = +d["Vegetable Consumption (%)"];
    });
    // Once health data is loaded, if sportsDataAll is also loaded, call updateCircles
    if (sportsDataAll.length > 0) updateCircles("2022");
});

// Load Sports Data
d3.csv("data/sports_data.csv").then(data => {
    sportsDataAll = data;
    sportsDataAll.forEach(d => {
        // Convert numeric fields
        if (d["Exercise Frequency (Regularly)"] !== undefined) d["Exercise Frequency (Regularly)"] = +d["Exercise Frequency (Regularly)"];
        if (d["Exercise Frequency (Some Regularity)"] !== undefined) d["Exercise Frequency (Some Regularity)"] = +d["Exercise Frequency (Some Regularity)"];
        if (d["Vigorous Activity (Never)"] !== undefined) d["Vigorous Activity (Never)"] = +d["Vigorous Activity (Never)"];
    });
    // If healthDataAll is loaded too, call updateCircles
    if (healthDataAll.length > 0) updateCircles("2022");
});

// Color scale
const colorScaleHC = d3.scaleOrdinal()
    .domain(countries)
    .range(["rgb(0, 112, 192)", "rgb(0, 128, 0)", "rgb(255, 165, 0)"]);

const topY = () => mainHex[1][1];
const bottomY = () => mainHex[4][1];
const leftXMax = widthHC / 2; // divider
const rightXMin = widthHC / 2;
const leftSectionMargin = 30;
const rightSectionMargin = 30;

function placeCirclesInRect(values, scale, rect, side) {
    const W = rect.xMax - rect.xMin;
    const H = rect.yMax - rect.yMin;
    const Cx = rect.xMin + W / 2;
    const Cy = rect.yMin + H / 2;

    const largest = values[0];
    const medium = values[1];
    const smallest = values[2];

    const rLargest = scale(largest.value);
    const rMedium = scale(medium.value);
    const rSmallest = scale(smallest.value);

    const xOffset = side === "left" ? -W / 4 - 50 : W / 4 + 50;
    const largestCx = Cx + xOffset;
    const largestCy = Cy;

    const mediumCx = side === "left" ? Cx + W / 5 : Cx - W / 5;
    const mediumCy = Cy - H / 5 + 10;

    const smallestCx = side === "left" ? Cx : Cx;
    const smallestCy = Cy + H / 2.5;

    return [
        { country: largest.country, value: largest.value, x: largestCx, y: largestCy, r: rLargest },
        { country: medium.country, value: medium.value, x: mediumCx, y: mediumCy, r: rMedium },
        { country: smallest.country, value: smallest.value, x: smallestCx, y: smallestCy, r: rSmallest }
    ];
}

function drawCircles(circles) {
    // Remove old circles and texts first
    svgHC.selectAll("circle.data-circle").remove();
    svgHC.selectAll("text.data-text").remove();

    circles.forEach(c => {
        svgHC.append("circle")
            .attr("class", "data-circle")
            .attr("cx", c.x)
            .attr("cy", c.y)
            .attr("r", c.r)
            .attr("fill", "none")
            .attr("stroke", colorScaleHC(c.country))
            .attr("stroke-width", 2);

        svgHC.append("text")
            .attr("class", "data-text")
            .attr("x", c.x)
            .attr("y", c.y + 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .style("font-weight", "bold")
            .text(`${(c.value).toFixed(1)}%`);
    });
}

const regularHexagonPoints = (cx, cy, r, rotationAngle) => {
    return Array.from({ length: 6 }, (_, i) => {
        const angle = rotationAngle + (Math.PI / 3) * i; // 60° increments
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });
};

function addHexagonAlongEdge(start, end, colorFill = "#e0f7fa", colorStroke = "#0097a7") {
    const edgeLength = Math.sqrt(
        Math.pow(end[0] - start[0], 2) +
        Math.pow(end[1] - start[1], 2)
    );
    const edgeAngle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const vIndex = 2;
    const vertexAngle = edgeAngle + vIndex * (Math.PI / 3);
    const gap = -10;
    const perpendicularAngle = edgeAngle + Math.PI / 2;
    const chosenVertexX = start[0] + gap * Math.cos(perpendicularAngle);
    const chosenVertexY = start[1] + gap * Math.sin(perpendicularAngle);
    const newHexCenterX = chosenVertexX - edgeLength * Math.cos(vertexAngle);
    const newHexCenterY = chosenVertexY - edgeLength * Math.sin(vertexAngle);
    const newHexPoints = regularHexagonPoints(newHexCenterX, newHexCenterY, edgeLength, edgeAngle);

    svgHC.append("polygon")
        .attr("points", newHexPoints.map(d => d.join(",")).join(" "))
        .attr("fill", colorFill)
        .attr("stroke", colorStroke)
        .attr("stroke-width", 2);

    return { centerX: newHexCenterX, centerY: newHexCenterY, points: newHexPoints };
}

const upperLeftStart = mainHex[0];
const upperLeftEnd = mainHex[1];
const upperLeftHex = addHexagonAlongEdge(upperLeftStart, upperLeftEnd);

const upperRightStart = mainHex[2];
const upperRightEnd = mainHex[3];
const upperRightHex = addHexagonAlongEdge(upperRightStart, upperRightEnd);

const lowerRightStart = mainHex[3];
const lowerRightEnd = mainHex[4];
const lowerRightHex = addHexagonAlongEdge(lowerRightStart, lowerRightEnd);

const lowerLeftStart = mainHex[5];
const lowerLeftEnd = mainHex[0];
const lowerLeftHex = addHexagonAlongEdge(lowerLeftStart, lowerLeftEnd);

function linePolygonIntersection(polygon, x0, y0, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    let closestPoint = null;
    let closestDist = Infinity;

    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];

        const x_e1 = p1[0], y_e1 = p1[1];
        const x_e2 = p2[0], y_e2 = p2[1];

        const dx_e = x_e2 - x_e1;
        const dy_e = y_e2 - y_e1;

        const denom = (cosA * (-dy_e)) - (sinA * (-dx_e));
        if (Math.abs(denom) < 1e-9) continue;

        const rhs1 = x_e1 - x0;
        const rhs2 = y_e1 - y0;

        const t = (rhs1 * (-dy_e) - rhs2 * (-dx_e)) / denom;

        if (t > 0) {
            const xI = x0 + t * cosA;
            const yI = y0 + t * sinA;
            const dist = Math.sqrt((xI - x0) ** 2 + (yI - y0) ** 2);

            const u = (cosA * rhs2 - sinA * rhs1) / denom;
            if (u >= 0 && u <= 1 && dist < closestDist) {
                closestDist = dist;
                closestPoint = [xI, yI];
            }
        }
    }

    return closestPoint;
}

function drawYShape(polygon, centerX, centerY) {
    const initialAngle = 0;
    for (let i = 0; i < 3; i++) {
        const angle = initialAngle + (i * 2 * Math.PI) / 3;
        const intersection = linePolygonIntersection(polygon, centerX, centerY, angle);
        if (intersection) {
            svgHC.append("line")
                .attr("x1", centerX)
                .attr("y1", centerY)
                .attr("x2", intersection[0])
                .attr("y2", intersection[1])
                .attr("stroke", "#666")
                .attr("stroke-width", 2);
        }
    }
}

drawYShape(upperLeftHex.points, upperLeftHex.centerX, upperLeftHex.centerY);
drawYShape(upperRightHex.points, upperRightHex.centerX, upperRightHex.centerY);
drawYShape(lowerRightHex.points, lowerRightHex.centerX, lowerRightHex.centerY);
drawYShape(lowerLeftHex.points, lowerLeftHex.centerX, lowerLeftHex.centerY);

// Titles for upper hexagons
svgHC.append("text")
    .attr("x", upperLeftHex.centerX)
    .attr("y", upperLeftHex.points[5][1] - 10) // Position above the upper-left hexagon
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("% of Students Exercising Frequently");

svgHC.append("text")
    .attr("x", upperRightHex.centerX)
    .attr("y", upperRightHex.points[4][1] - 10) // Position above the upper-right hexagon
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("% of Students Eating Fruits");

// Titles for lower hexagons
svgHC.append("text")
    .attr("x", lowerLeftHex.centerX)
    .attr("y", lowerLeftHex.points[4][1] + 15) // Position below the lower-left hexagon
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("% of Students Exercising Vigorously");

svgHC.append("text")
    .attr("x", lowerRightHex.centerX)
    .attr("y", lowerRightHex.points[5][1] + 15) // Position below the lower-right hexagon
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("% of Students Eating Vegetables");

// dataType: one of ["frequency_exercise", "duration_exercise", "fruits", "vegetables"]
function addWedgeCirclesToHex(hex, year, hexName, dataType) {
    let valuesByCountry = {};

    if (dataType === "frequency_exercise" || dataType === "duration_exercise") {
        // Filter sports data
        const filteredSports = sportsDataAll.filter(d => d.Year === year && countries.includes(d.Country));
        filteredSports.forEach(d => {
            const c = d.Country;
            if (dataType === "frequency_exercise") {
                // Exercise Frequency (Regularly) + Exercise Frequency (Some Regularity)
                const val = ((d["Exercise Frequency (Regularly)"] || 0) + (d["Exercise Frequency (Some Regularity)"] || 0));
                valuesByCountry[c] = val;
            } else if (dataType === "duration_exercise") {
                // 100 - Vigorous Activity (Never)
                const val = 100 - (d["Vigorous Activity (Never)"] || 0);
                valuesByCountry[c] = val;
            }
        });
    } else if (dataType === "fruits" || dataType === "vegetables") {
        // Filter health data
        const filteredHealth = healthDataAll.filter(d => d.Year === year && d.Sex === "Total" && countries.includes(d.Country));
        filteredHealth.forEach(d => {
            const c = d.Country;
            if (dataType === "fruits") {
                valuesByCountry[c] = d["Fruit Consumption (%)"] || 0;
            } else if (dataType === "vegetables") {
                valuesByCountry[c] = d["Vegetable Consumption (%)"] || 0;
            }
        });
    }

    const vals = Object.values(valuesByCountry);
    if (vals.length === 0) return; // No data

    const minVal = d3.min(vals);
    const maxVal = d3.max(vals);
    const rScale = d3.scaleLinear().domain([minVal, maxVal]).range([10, 25]);

    // Fixed mapping of countries to wedge angles
    const countryWedgeMap = {
        "France": 60,       // Top-left wedge
        "Italy": 180,       // Bottom wedge
        "Netherlands": 300  // Top-right wedge
    };

    // Remove old wedge circles/text
    svgHC.selectAll(".wedge-circle-" + hexName).remove();
    svgHC.selectAll(".wedge-circle-text-" + hexName).remove();

    // Add circles
    countries.forEach(c => {
        const val = valuesByCountry[c];
        if (val == null) return;

        const angleDeg = countryWedgeMap[c];
        const angleRad = angleDeg * Math.PI / 180;

        const radiusFromCenter = 70;
        const cx = hex.centerX + radiusFromCenter * Math.cos(angleRad);
        const cy = hex.centerY + radiusFromCenter * Math.sin(angleRad);

        svgHC.append("circle")
            .attr("class", "wedge-circle-" + hexName)
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", rScale(val) * 2)
            .attr("fill", "none")
            .attr("stroke", colorScaleHC(c))
            .attr("stroke-width", 2);

        svgHC.append("text")
            .attr("class", "wedge-circle-text-" + hexName)
            .attr("x", cx)
            .attr("y", cy + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text(`${val.toFixed(1)}%`);
    });
}

function updateCircles(year) {
    if (healthDataAll.length === 0 || sportsDataAll.length === 0) return;
    const filteredData = healthDataAll.filter(d => d.Year === year && d.Sex === "Total" && countries.includes(d.Country));

    const healthyValues = countries.map(c => ({ country: c, value: filteredData.find(d => d.Country === c)["Healthy (%)"] }));
    const sphValues = countries.map(c => ({ country: c, value: filteredData.find(d => d.Country === c)["SPH"] }));

    const leftRect = {
        xMin: (mainHex[0][0] + leftXMax) / 2,
        xMax: leftXMax - leftSectionMargin,
        yMin: topY() + 20,
        yMax: bottomY() - 20
    };

    const rightRect = {
        xMin: rightXMin + rightSectionMargin,
        xMax: (mainHex[3][0] + rightXMin) / 2,
        yMin: topY() + 20,
        yMax: bottomY() - 20
    };

    const minRadius = 23, maxRadius = 40;
    const healthyScale = d3.scaleLinear()
        .domain(d3.extent(healthyValues, d => d.value))
        .range([minRadius, maxRadius]);

    const sphScale = d3.scaleLinear()
        .domain(d3.extent(sphValues, d => d.value))
        .range([minRadius, maxRadius]);

    healthyValues.sort((a, b) => b.value - a.value);
    sphValues.sort((a, b) => b.value - a.value);

    const leftCircles = placeCirclesInRect(healthyValues, healthyScale, leftRect, "left");
    const rightCircles = placeCirclesInRect(sphValues, sphScale, rightRect, "right");

    drawCircles([...leftCircles, ...rightCircles]);

    // Call for each hex with correct dataType
    addWedgeCirclesToHex(upperLeftHex, year, "UL", "frequency_exercise");
    addWedgeCirclesToHex(upperRightHex, year, "UR", "fruits");
    addWedgeCirclesToHex(lowerLeftHex, year, "LL", "duration_exercise");
    addWedgeCirclesToHex(lowerRightHex, year, "LR", "vegetables");
}
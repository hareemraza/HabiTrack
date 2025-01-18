
document.addEventListener("DOMContentLoaded", function () {
    let allData = [];

    // Define colors for each category within each country
    const countryColors = {
        France: { Normal: "#4682B4", Overweight: "#5A9BD4", Obese: "#87CEEB" },
        Italy: { Normal: "#228B22", Overweight: "#32CD32", Obese: "#7CFC00" },
        Netherlands: { Normal: "#FF8C00", Overweight: "#FFA54D", Obese: "#FFD27F" }
    };

    // Load the CSV data
    d3.csv("data/sports_data.csv").then(function (data) {
        allData = data.filter(d => d.Year === "2022"); // Filter only for the year 2022
        createCountriesChart();
        createCategoriesChart();
    });

    // Handle tab switching
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", function () {
            // Remove active class from all buttons and contents
            document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

            // Add active class to the clicked button and corresponding content
            this.classList.add("active");
            document.getElementById(this.dataset.tab).classList.add("active");
        });
    });

    function processCountryData(countryName, data) {
        const row = data.find(d => d.Country === countryName);

        if (!row) {
            console.warn(`No data found for ${countryName}.`);
            return [];
        }

        // Parse data for normal, overweight, and obese percentages
        const overweightVal = parseFloat(row["Overweight (%)"]) || 0;
        const obeseVal = parseFloat(row["Obese (%)"]) || 0;
        const normalVal = 100 - (overweightVal + obeseVal);

        return [
            { country: countryName, category: "Normal", value: normalVal },
            { country: countryName, category: "Overweight", value: overweightVal },
            { country: countryName, category: "Obese", value: obeseVal }
        ];
    }

    function createCountriesChart() {
        const chartData = [
            processCountryData("France", allData),
            processCountryData("Netherlands", allData),
            processCountryData("Italy", allData)
        ].flat();

        createGroupedBarChart(chartData, "#chart-container-countries", "countries");
    }

    function addGradientLegend(svg, width, margin) {
        const legendWidth = 160;
        const legendHeight = 15;
    
        // Gradient for the legend
        const defs = svg.append("defs");
    
        // Add gradients for all countries
        Object.keys(countryColors).forEach(country => {
            const gradient = defs.append("linearGradient")
                .attr("id", `gradient-${country}`)
                .attr("x1", "0%")
                .attr("x2", "100%")
                .attr("y1", "0%")
                .attr("y2", "0%");
    
            // Add stops for each health category
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", countryColors[country].Normal);
    
            gradient.append("stop")
                .attr("offset", "50%")
                .attr("stop-color", countryColors[country].Overweight);
    
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", countryColors[country].Obese);
        });
    
        // Add legend group above the chart
        const legend = svg.append("g")
            //.attr("transform", `translate(${(width - legendWidth) / 2}, -40)`); // Adjust the y-coordinate to position above the plot
            .attr("transform", `translate(${(width - legendWidth) / 2 + 300}, -40)`);

    
    
        // Add gradient bars for each country
        let legendOffset = 10;
        Object.keys(countryColors).forEach(country => {
            // Add gradient bar
            legend.append("rect")
                .attr("x", 0)
                .attr("y", legendOffset)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", `url(#gradient-${country})`);
    
            // Add country label
            legend.append("text")
                .attr("x", legendWidth + 10)
                .attr("y", legendOffset + legendHeight / 2 + 5) // Center the text vertically
                .style("font-size", "12px")
                .text(country);
    
            legendOffset += legendHeight + 10; // Space between legend rows
        });
    
        // Add labels for gradient scale (Healthy, Overweight, Obese)
        const labelOffset = legendOffset + 10; // Adjust for spacing below the last gradient
    
        legend.append("text")
            .attr("x", 0)
            .attr("y", labelOffset)
            .style("font-size", "12px")
            .style("text-anchor", "start")
            .text("Healthy");
    
        legend.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", labelOffset)
            .style("font-size", "12px")
            .style("text-anchor", "middle")
            .text("Overweight");
    
        legend.append("text")
            .attr("x", legendWidth)
            .attr("y", labelOffset)
            .style("font-size", "12px")
            .style("text-anchor", "end")
            .text("Obese");
    }

    function createCategoriesChart() {
        // Group by categories (Normal, Overweight, Obese)
        const groupedData = ["Normal", "Overweight", "Obese"].map(category => {
            return allData.map(d => {
                let value;
                if (category === "Normal") {
                    // Calculate Normal (%)
                    value = 100 - (parseFloat(d["Overweight (%)"]) || 0) - (parseFloat(d["Obese (%)"]) || 0);
                } else {
                    // Use Overweight (%) or Obese (%) directly
                    value = parseFloat(d[`${category} (%)`] || 0);
                }
                return {
                    category,
                    country: d.Country,
                    value: value
                };
            });
        }).flat();

        createGroupedBarChartCategory(groupedData, "#chart-container-categories", "categories");
    }

    function createGroupedBarChart(data, containerId, mode) {
        const margin = { top: 50, right: 30, bottom: 70, left: 60 };

        const width = 1000 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
    
        const categories = Array.from(new Set(data.map(d => d.category)));
        const labels = mode === "countries"
            ? Array.from(new Set(data.map(d => d.country)))
            : categories;
    
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + 50) // Extra space for the legend
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        const x0 = d3.scaleBand().domain(labels).range([0, width]).padding(0.2);
        const x1 = d3.scaleBand().domain(categories).range([0, x0.bandwidth()]).padding(0.1);
        const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);
    
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "16px");
    
        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .style("font-size", "14px");
        
        // Add y-axis label
        svg.append("text")
        .attr("transform", "rotate(-90)") // Rotate the text to align with the y-axis
        .attr("y", -margin.left + 0) // Position to the left of the y-axis
        .attr("x", -(height / 2)) // Center vertically
        .attr("dy", "1em") // Add some padding
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Percentage of Students");
    
        // Create groups for each set of bars
        const groups = svg.append("g")
            .selectAll("g")
            .data(labels.map(label => data.filter(d => mode === "countries" ? d.country === label : d.category)))
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x0(d[0][mode === "countries" ? "country" : "category"])}, 0)`);
    
        // Add bars
        const bars = groups
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x1(d.category))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => countryColors[d.country][d.category])
            .attr("class", d => `bar-${d.category}`);
    
        // // Add labels on top of bars
        groups
            .selectAll("text")
            .data(d => d)
            .enter()
            .append("text")
            .attr("x", d => x1(d.category) + x1.bandwidth() / 2)
            .attr("y", d => y(d.value) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text(d => `${d.value.toFixed(1)}%`);
    
        // Add horizontal line for hover interaction
        const hoverLine = svg.append("line")
            .attr("stroke", "#704f0d")
            .attr("stroke-dasharray", "2")
            .attr("opacity", 0);
    
        // Add tooltip
        const tooltip = d3.select(containerId)
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "12px");
    
        // Hover interaction
        bars.on("mouseover", function (event, d) {
            // Highlight bars of the same category
            d3.selectAll(`.bar-${d.category}`).attr("opacity", 1);
            d3.selectAll(`rect:not(.bar-${d.category})`).attr("opacity", 0.2);
    
            // Show horizontal line
            hoverLine
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", y(d.value))
                .attr("y2", y(d.value))
                .attr("opacity", 1);
    
            // Show tooltip
            tooltip
                .style("visibility", "visible")
                .html(`Country: <strong>${d.country}</strong><br>
                       Category: <strong>${d.category}</strong><br>
                       Percentage: <strong>${d.value.toFixed(1)}%</strong>`);
        })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                // Reset bar opacity
                d3.selectAll("rect").attr("opacity", 1);
    
                // Hide horizontal line
                hoverLine.attr("opacity", 0);
    
                // Hide tooltip
                tooltip.style("visibility", "hidden");
            });
    
        addGradientLegend(svg, width, margin);
    }
    

    function createGroupedBarChartCategory(data, containerId) {
        const margin = { top: 50, right: 30, bottom: 70, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
    
        // Extract unique categories and countries
        const categories = Array.from(new Set(data.map(d => d.category)));
        const countries = Array.from(new Set(data.map(d => d.country)));
    
        // Create scales
        const x0 = d3.scaleBand().domain(categories).range([0, width]).padding(0.2); // Categories on x-axis
        const x1 = d3.scaleBand().domain(countries).range([0, x0.bandwidth()]).padding(0.1); // Sub-bands for countries
        const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);
    
        // Create SVG container
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "16px");
    
        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .style("font-size", "14px");
        
        // Add y-axis label
        svg.append("text")
        .attr("transform", "rotate(-90)") // Rotate the text to align with the y-axis
        .attr("y", -margin.left + 0) // Position to the left of the y-axis
        .attr("x", -(height / 2)) // Center vertically
        .attr("dy", "1em") // Add some padding
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Percentage of Students");
            
        // Create groups for each category
        const groups = svg.append("g")
            .selectAll("g")
            .data(categories.map(category => data.filter(d => d.category === category)))
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x0(d[0].category)}, 0)`);
    
        // Add bars
        const bars = groups
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x1(d.country)) // Position bars within each category
            .attr("y", d => y(d.value)) // Height based on value
            .attr("width", x1.bandwidth()) // Bar width based on x1 scale
            .attr("height", d => height - y(d.value)) // Bar height
            .attr("fill", d => countryColors[d.country][d.category]) // Color based on country and category
            .attr("class", d => `bar-${d.country}`); // Add a class for hover effects
    
        // Add labels on top of the bars
        groups
            .selectAll("text")
            .data(d => d)
            .enter()
            .append("text")
            .attr("x", d => x1(d.country) + x1.bandwidth() / 2) // Center the label horizontally within the bar
            .attr("y", d => y(d.value) - 5) // Position above the bar (5px above the bar's top)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "black") // Use black for better visibility outside the bars
            .text(d => `${d.value.toFixed(1)}%`);
    
        // Add tooltip
        const tooltip = d3.select(containerId)
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "12px");
    
        // Add horizontal line for hover interaction
        const hoverLine = svg.append("line")
            .attr("stroke", "#704f0d")
            .attr("stroke-dasharray", "2")
            .attr("opacity", 0);
    
        // Hover interaction
        bars.on("mouseover", function (event, d) {
            // Highlight bars of the same country
            d3.selectAll(`.bar-${d.country}`).attr("opacity", 1);
            d3.selectAll(`rect:not(.bar-${d.country})`).attr("opacity", 0.2);
    
            // Show horizontal line
            hoverLine
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", y(d.value))
                .attr("y2", y(d.value))
                .attr("opacity", 1);
    
            // Show tooltip
            tooltip
                .style("visibility", "visible")
                .html(`Country: <strong>${d.country}</strong><br>
                       Category: <strong>${d.category}</strong><br>
                       Percentage: <strong>${d.value.toFixed(1)}%</strong>`);
        })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                // Reset bar opacity
                d3.selectAll("rect").attr("opacity", 1);
    
                // Hide horizontal line
                hoverLine.attr("opacity", 0);
    
                // Hide tooltip
                tooltip.style("visibility", "hidden");
            });
    
        // Create legend
        function createSimpleLegend(svg, width, margin) {
            const legendData = [
                { country: "France", color: "#4682B4" },
                { country: "Italy", color: "#228B22" },
                { country: "Netherlands", color: "#FF8C00" }
            ];
    
            const legend = svg.append("g")
                .attr("transform", `translate(${width - margin.right - 100}, 0)`); // Adjust position
    
            // Add legend title
            legend.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text("Country");
    
            // Add legend items
            legendData.forEach((d, i) => {
                // Add colored square
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", 20 + i * 20) // Adjust y position for each item
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", d.color);
    
                // Add country name
                legend.append("text")
                    .attr("x", 20)
                    .attr("y", 30 + i * 20) // Align with rectangles
                    .style("font-size", "12px")
                    .text(d.country);
            });
        }
    
        createSimpleLegend(svg, width, margin);
    }

    
});

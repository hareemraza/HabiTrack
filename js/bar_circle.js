document.addEventListener("DOMContentLoaded", function () {
    let allData = [];

    // Define colors for each category within each country
    const countryColors = {
        France: {
            Normal: "#4682B4", // Blue
            Overweight: "#5A9BD4", // Lighter Blue
            Obese: "#87CEEB" // Lightest Blue
        },
        Italy: {
            Normal: "#228B22", // Dark Green
            Overweight: "#32CD32", // Medium Green
            Obese: "#7CFC00" // Light Green
        },
        Netherlands: {
            Normal: "#FF8C00", // Orange
            Overweight: "#FFA54D", // Lighter Orange
            Obese: "#FFD27F" // Lightest Orange
        }
    };

    // Load the CSV data
    d3.csv('data/sports_data.csv').then(function (data) {
        allData = data;

        // Display data for the year 2022 directly
        const dataYear = allData.filter(d => d.Year === "2022");
        if (dataYear.length === 0) {
            console.error("No data available for the year 2022.");
            return;
        }

        // Prepare data for grouped bar chart
        const chartData = [
            processCountryData("France", dataYear),
            processCountryData("Netherlands", dataYear),
            processCountryData("Italy", dataYear),
        ].flat();

        // Create the grouped bar chart
        createGroupedBarChart(chartData);
    });

    function processCountryData(countryName, dataYear) {
        const row = dataYear.find(d => d.Country === countryName);

        if (!row) {
            console.warn(`No data found for ${countryName} in the given year.`);
            return [];
        }

        // Parse data for normal, overweight, and obese percentages
        const overweightVal = parseFloat(row["Overweight (%)"]) || 0;
        const obeseVal = parseFloat(row["Obese (%)"]) || 0;
        const normalVal = 100 - (overweightVal + obeseVal);

        return [
            { country: countryName, category: "Normal", value: normalVal },
            { country: countryName, category: "Overweight", value: overweightVal },
            { country: countryName, category: "Obese", value: obeseVal },
        ];
    }

    function createGroupedBarChart(data) {
        // Set up dimensions and margins
        const margin = { top: 50, right: 30, bottom: 70, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Extract unique categories and countries
        const categories = Array.from(new Set(data.map(d => d.category)));
        const countries = Array.from(new Set(data.map(d => d.country)));

        // Create SVG container
        const svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Create scales
        const x0 = d3.scaleBand()
            .domain(countries)
            .range([0, width])
            .padding(0.2);

        const x1 = d3.scaleBand()
            .domain(categories)
            .range([0, x0.bandwidth()])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([height, 0]);

        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "16px");

        // Add Y-axis
        svg.append("g")
            .call(d3.axisLeft(y))
            .style("font-size", "16px")
            .selectAll("text")
            .style("font-size", "16px");

        // Add grouped bars
        svg.append("g")
            .selectAll("g")
            .data(countries.map(country => data.filter(d => d.country === country)))
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x0(d[0].country)}, 0)`)
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x1(d.category))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => countryColors[d.country][d.category]); // Assign color based on country and category

        // Add labels above the bars
        svg.append("g")
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("x", d => x0(d.country) + x1(d.category) + x1.bandwidth() / 2)
            .attr("y", d => y(d.value) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#000")
            .text(d => `${d.value.toFixed(1)}%`);
    }
});

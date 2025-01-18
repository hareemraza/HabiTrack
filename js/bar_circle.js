$(document).ready(function () {
    let allData = []; 
    d3.csv('data/sports_data.csv').then(function (data) {
        allData = data;

        // Default year: 2019 (as selected in the <select>)
        let initialYear = $('#yearSelect').val();
        updateCharts(initialYear);
    });

    // When the user changes the dropdown, update the charts
    $('#yearSelect').on('change', function () {
        let selectedYear = this.value;
        updateCharts(selectedYear);
    });

    // Function that re-filters data by selected year, then draws charts
    function updateCharts(year) {
        // 1. Filter the main dataset by the chosen year
        let dataYear = allData.filter(d => d.Year === year);

        // 2. Build data arrays for each country
        let franceData      = processCountryData("France", dataYear);
        let netherlandsData = processCountryData("Netherlands", dataYear);
        let italyData       = processCountryData("Italy", dataYear);

        // 3. Clear old charts (remove old <svg> if it exists) to avoid stacking
        d3.select("#chart1").selectAll("svg").remove();
        d3.select("#chart2").selectAll("svg").remove();
        d3.select("#chart3").selectAll("svg").remove();

        // 4. Create the new charts
        create_chart("chart1", franceData);
        create_chart("chart2", netherlandsData);
        create_chart("chart3", italyData);
    }

    // Helper to transform the data row for a single country
    function processCountryData(countryName, dataYear) {
        let row = dataYear.find(d => d.Country === countryName);

        if (!row) {
            console.warn("No data found for", countryName, "in the given year.");
            return [];
        }

        // We want Overweight (%), Obese (%) and Normal (%)
        let overweightVal = parseFloat(row["Overweight (%)"]) || 0;
        let obeseVal      = parseFloat(row["Obese (%)"]) || 0;
        let normalVal     = 100 - (overweightVal + obeseVal);

        // Return as an array of objects for the donut
        return [
            { label: "Overweight", value: overweightVal, code: "overweight" },
            { label: "Obese",      value: obeseVal,      code: "obese" },
            { label: "Normal",     value: normalVal,     code: "normal" }
        ];
    }


    function create_chart(containerId, data) {

        var chartElement = document.querySelector(`#${containerId}`);
        var width = parseInt(chartElement.dataset.width, 10);
        var height = parseInt(chartElement.dataset.height, 10);
        var radius = parseInt(chartElement.dataset.r, 10);
        var innerradius = parseInt(chartElement.dataset.ir, 10);
        var country = chartElement.dataset.country;

        var source_name = d3.select("body").append("div")
            .attr("class", "source_name")
            .style("opacity", 0);

        var funfact = d3.select("body").append("div")
            .attr("class", "funfact")
            .attr("id", "funfact-popup-container")
            .style("opacity", 0);

        var arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(innerradius);

        const hoverArc = d3.arc()
            .innerRadius(innerradius + 20)
            .outerRadius(radius + 30) // to make the arc bigger over hover 
        // .cornerRadius(radius + 30)

        const zeroArc = d3.arc()
            .outerRadius(1)
            .innerRadius(innerradius); // Optional, if you want a hollow arc

        var labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        data.forEach(function (d) {
            d.total = +d.value;
        });

        var pie = d3.pie()
            .startAngle(-90 * (Math.PI / 180))
            .endAngle(90 * (Math.PI / 180))
            .sort(null)
            .value(function (d) { return d.total; });

        var pieData = pie(data);
        var mult = 3;
        var svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", width * mult)
            .attr("height", height * mult / 2)
            .append("g")
            .attr('class', 'piechart')
            .attr("transform", "translate(" + width * mult / 2 + "," + height * mult / 3.5 + ")");
        var totalSum = data.reduce(function (accumulator, currentValue) {
            return accumulator + currentValue.value;
        }, 0);
        var formattedTotal = country;
        var text = svg.append('g')
            .append("text")
            .attr("text-anchor", "middle")  // Center the text
            .attr("x", -2)           // Horizontally center the text in the SVG
            .attr("y", -30)
            .attr("class", "total")         // Vertically position the text in the middle
            .attr("dy", "-0.5em")            // Adjust the position under the arc
            .text(formattedTotal)         // The text to display //EURO stat 2021

        //__ text
        var segments = svg.append('g').attr('class', 'segments');

        var slices = segments.selectAll(".arc")
            .data(pieData)
            .enter().append("g")
            .attr("class", "arc")
            .attr('id', function (d) { return d.data.code; })

        var colors = {
            // "France": ["#85C1E9", "#3498DB", "#21618C"], // Shades of blue
            // "Italy": ["#A9DFBF", "#58D68D", "#1E8449"], // Shades of green
            // "Netherlands": ["#F9E79F", "#F4D03F", "#D4AC0D"] // Shades of yellow
            "France": ["#85C1E9", "#0070C0", "#1B4F72"], // Light to dark shades of blue
            "Italy": ["#A9DFBF", "#008000", "#145A32"], // Light to dark shades of green
            "Netherlands": ["#F9E79F", "#FFA500", "#D68910"] // Light to dark shades of orange-yellow
        };

        // Determine the colors based on the country
        var countryColors = colors[country] || ["#EDB458", "#E8871E", "#C8963E"]; // Fallback colors

        slices.append("path")
            .attr('d', zeroArc)
            .attr('class', 'arc')
            .style('fill-opacity', 0.7)
            .data(pieData)
            .attr('fill', function (d, i) {
                return countryColors[i % countryColors.length];
            })
            .on('mouseover', function (d) {
                d3.select(this)
                    .transition()
                    .duration(500)
                    .attr('d', hoverArc)
                    .style('fill-opacity', 1)
                    .transition().duration(500)
                    .attr('d', hoverArc)
                    .style('stroke-width', 10)
                    .style('stroke', '#f2f2ba')

            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .style('fill-opacity', 0.7)
                    .transition()
                    .duration(500)
                    .attr('d', arc)
                funfact.transition()
                    .duration(50)
                    .style("opacity", 0);
            })
            .transition()
            .duration(1000)
            .delay((d, i) => i * 300)
            .attr('d', arc)


        //__labels
        var labels = svg.append('g').attr('class', 'labels');

        var label = labels.selectAll('text').data(pieData)
            .enter()
            .append('svg:image')

        label
            .attr('x', function (d) {
                if (d.data.code == "cow") {
                    var a =
                        d.startAngle +
                        (d.endAngle - d.startAngle) / 2 -
                        Math.PI / 2;
                    d.cx = Math.cos(a) * (innerradius + (radius - innerradius) / 2);
                    return (d.x = Math.cos(a) * (radius + 50) - 100);

                } else {
                    var a =
                        d.startAngle +
                        (d.endAngle - d.startAngle) / 2 -
                        Math.PI / 2;
                    d.cx = Math.cos(a) * (innerradius + (radius - innerradius) / 2);
                    return (d.x = Math.cos(a) * (radius + 50) - 50);
                }
            })
            .attr('y', function (d) {
                if (d.data.code == "cow") {
                    var a =
                        d.startAngle +
                        (d.endAngle - d.startAngle) / 2 -
                        Math.PI / 2;
                    d.cy = Math.sin(a) * (innerradius + (radius - innerradius) / 2);
                    return (d.y = Math.sin(a) * (radius + 50) - 25)

                } else {
                    var a =
                        d.startAngle +
                        (d.endAngle - d.startAngle) / 2 -
                        Math.PI / 2;
                    d.cy = Math.sin(a) * (innerradius + (radius - innerradius) / 2);
                    return (d.y = Math.sin(a) * (radius + 50) - 50 / 2)
                };
            })
            .attr('xlink:href', function (d) {
                return "images/" + d.data.code + ".png";
            }).attr("class", "icon")
            .attr("width", 40)
            .attr("height", 40)
            .each(function (d) {
                var bbox = this.getBBox();
                d.sx = d.x - bbox.width / 2 - 2;
                d.ox = d.x + bbox.width / 2 + 2;
                d.sy = d.oy = d.y + 5;
            })
            .on('mouseover', function (d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '.85');

                source_name.transition()
                    .duration(50)
                    .style("opacity", 1);
                let name = i
                // console.log(i)
                source_name.html(i.data.label)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '1');

                source_name.transition()
                    .duration('50')
                    .style("opacity", 0)
            }).on("click", function (event, d) {
                //console.log(sources[d]) //debug icons 

            });

        labels.transition().duration(300);

        labels.exit().remove();
    }
});

function closeInfoPopup() {
    document.getElementById('info-popup-container').style.display = 'none';
}

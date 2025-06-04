let housingData;
let currentView = 'total';
let originalColors = {};
let hoverPanel;

function getNationalStats() {
    const nationalData = {
        total_severely_housing_deprived: {
            percentage: 100
        },
        categories: {
            without_shelter: {
                percentage: 0,
                number: 0
            },
            temporary_accommodation: {
                percentage: 0,
                number: 0
            },
            sharing_accommodation: {
                percentage: 0,
                number: 0
            }
        }
    };

    housingData.homelessness_data.regional_data.forEach(region => {
        nationalData.categories.without_shelter.number += region.categories.without_shelter.number;
        nationalData.categories.temporary_accommodation.number += region.categories.temporary_accommodation.number;
        nationalData.categories.sharing_accommodation.number += region.categories.sharing_accommodation.number;
    });

    const totalWithout = nationalData.categories.without_shelter.number;
    const totalTemporary = nationalData.categories.temporary_accommodation.number;
    const totalSharing = nationalData.categories.sharing_accommodation.number;
    const totalAll = totalWithout + totalTemporary + totalSharing;

    nationalData.categories.without_shelter.percentage = (totalWithout / totalAll) * 100;
    nationalData.categories.temporary_accommodation.percentage = (totalTemporary / totalAll) * 100;
    nationalData.categories.sharing_accommodation.percentage = (totalSharing / totalAll) * 100;

    return nationalData;
}
window.onload = function () {
    d3.xml("images/nz.svg").then(function (xml) {
        const svgNode = xml.documentElement;

        const mainSvg = d3.select("main svg");
        mainSvg.node().appendChild(svgNode);

        d3.select(svgNode)
            .attr("width", "2000")
            .attr("height", "640")
            .attr("viewBox", "1582, 40, 600 1290");

        const labelsGroup = mainSvg.append("g")
            .attr("class", "labels-group");

        const buttonsContainer = d3.select("main")
            .insert("div", ":first-child")
            .attr("class", "buttons-container");

        hoverPanel = d3.select("body").append("div")
            .attr("class", "hover-panel")
            .style("opacity", 1);

        hoverPanel.append("h3").attr("class", "region-name").text("AOTEAROA");
        hoverPanel.append("div").attr("class", "hover-stats");

        d3.json("data/housingtypebyregion.json").then(function (data) {
            housingData = data;

            const nationalData = getNationalStats();
            const statsHTML = `
                                <div>The severely housing deprived population in Aotearoa is made up of three categories; 
                                those without any shelter, those who have been temporarily placed in accomodation, and those  
                                placed in shared accomodation.</div>
                                <div>Of all <strong>Total Severely Housing Deprived</strong>, there are:</div>
                                <div><strong>${nationalData.categories.without_shelter.percentage.toFixed(1)}% 
                                    </strong> <strong>Without Shelter</strong></div>
                                <div><strong>${nationalData.categories.temporary_accommodation.percentage.toFixed(1)}% 
                                    </strong> in <strong>Temporary Accomodation</strong></div>
                                <div><strong>${nationalData.categories.sharing_accommodation.percentage.toFixed(1)}% 
                                    </strong> that are <strong>Sharing Accomodation</strong></div>
                            `;
            hoverPanel.select(".hover-stats").html(statsHTML);

            buttonsContainer.append("button")
                .text("Total Severely Housing Deprived")
                .attr("class", "total")
                .on("click", () => updateVisualization('total'));

            buttonsContainer.append("button")
                .text("Without Shelter")
                .attr("class", "without")
                .on("click", () => updateVisualization('without'));

            buttonsContainer.append("button")
                .text("Temporary Accommodation")
                .attr("class", "temporary")
                .on("click", () => updateVisualization('temporary'));

            buttonsContainer.append("button")
                .text("Sharing Accommodation")
                .attr("class", "sharing")
                .on("click", () => updateVisualization('sharing'));

            updateVisualization(currentView);

        }).catch(function (error) {
            console.error("Error loading JSON data:", error);
        });

        function updateVisualization(view) {
            currentView = view;
            originalColors = {};

            buttonsContainer.selectAll("button")
                .classed("active", false)
                .filter("." + view)
                .classed("active", true);

            let withoutPercentages = {};
            let temporaryPercentages = {};
            let sharingPercentages = {};

            withoutPercentages = calcCategoryPercentages('without_shelter');
            temporaryPercentages = calcCategoryPercentages('temporary_accommodation');
            sharingPercentages = calcCategoryPercentages('sharing_accommodation');

            let withoutTotal = calcOverallNumber('without_shelter');
            let temporaryTotal = calcOverallNumber('without_shelter');
            let sharingTotal = calcOverallNumber('without_shelter');

            let regionPercentages = {};
            let colorRange;

            if (view === 'total') {
                housingData.homelessness_data.regional_data.forEach(d => {
                    regionPercentages[d.region] = d.total_severely_housing_deprived.percentage;
                });
                colorRange = ["black", "blue"];
            } else {
                const housingType = view === 'without' ? 'without_shelter' :
                    view === 'temporary' ? 'temporary_accommodation' : 'sharing_accommodation';

                const total = housingData.homelessness_data.regional_data.reduce((sum, d) => {
                    return sum + d.categories[housingType].number;
                }, 0);

                housingData.homelessness_data.regional_data.forEach(d => {
                    regionPercentages[d.region] = (d.categories[housingType].number / total) * 100;
                });

                colorRange = view === 'without' ? ["black", "red"] :
                    view === 'temporary' ? ["black", "orange"] :
                        ["black", "green"];
            }

            const maxPercentage = d3.max(Object.values(regionPercentages));
            const colorScale = d3.scaleLinear()
                .domain([0, maxPercentage])
                .range(colorRange);

            labelsGroup.selectAll("*").remove();

            const labelPositions = {
                "Auckland": [387, 110],
                "Wellington": [420, 305],
                "Canterbury": [280, 430],
                "Otago": [210, 505],
                "Northland": [360, 60],
                "Waikato": [417, 182],
                "Bay of Plenty": [467, 171],
                "Gisborne": [507, 176],
                "Hawke's Bay": [466, 218],
                "Taranaki": [378, 230],
                "Manawatu-Whanganui": [417, 243],
                "Nelson": [348, 300],
                "Marlborough": [347, 338],
                "Tasman": [320, 333],
                "West Coast": [281, 382],
                "Southland": [156, 548]
            };

            const labelRotations = {
                "Auckland": 65,
                "Wellington": -30,
                "Canterbury": -40,
                "Otago": 45,
                "Northland": 52,
                "Waikato": 0,
                "Bay of Plenty": 0,
                "Gisborne": -60,
                "Hawke's Bay": -53,
                "Taranaki": 30,
                "Manawatu-Whanganui": 68,
                "Nelson": -45,
                "Marlborough": -45,
                "Tasman": -50,
                "West Coast": -39,
                "Southland": 18
            };

            const labelSizes = {
                "Auckland": "8px",
                "Wellington": "7px",
                "Canterbury": "16px",
                "Otago": "15px",
                "Northland": "8px",
                "Waikato": "9px",
                "Bay of Plenty": "6px",
                "Gisborne": "9px",
                "Hawke's Bay": "8px",
                "Taranaki": "7px",
                "Manawatu-Whanganui": "7px",
                "Nelson": "6px",
                "Marlborough": "6px",
                "Tasman": "10px",
                "West Coast": "10px",
                "Southland": "12px"
            };

            const linePositions = {
                "Auckland": [383, 110, 337, 110, 317],
                "Wellington": [433, 305, 470, 305, 490],
                "Canterbury": [300, 430, 360, 430, 380],
                "Otago": [240, 505, 310, 505, 330],
                "Northland": [375, 55, 425, 55, 445],
                "Waikato": [417, 162, 370, 162, 350],
                "Bay of Plenty": [445, 155, 545, 155, 565],
                "Gisborne": [512, 180, 560, 180, 580],
                "Hawke's Bay": [466, 238, 516, 238, 526],
                "Taranaki": [378, 215, 328, 215, 308],
                "Manawatu-Whanganui": [410, 253, 367, 253, 347],
                "Nelson": [345, 310, 295, 310, 275],
                "Marlborough": [367, 338, 407, 338, 427],
                "Tasman": [313, 325, 270, 325, 250],
                "West Coast": [281, 362, 231, 362, 211],
                "Southland": [156, 520, 86, 520, 66]
            };

            function calcCategoryPercentages(category) {
                const total = housingData.homelessness_data.regional_data.reduce((sum, d) => {
                    return sum + d.categories[category].number;
                }, 0);

                let percentages = {};
                housingData.homelessness_data.regional_data.forEach(d => {
                    percentages[d.region] = (d.categories[category].number / total) * 100;
                });

                return percentages;
            }

            function calcOverallNumber(category) {
                const total = housingData.homelessness_data.regional_data.reduce((sum, d) => {
                    return sum + d.categories[category].number;
                }, 0);

                return total;
            }

            d3.select(svgNode).selectAll("path").each(function () {
                const regionName = d3.select(this).attr("name") ||
                    d3.select(this).attr("id") ||
                    d3.select(this).attr("data-name");

                if (!regionName) return;

                const percentage = regionPercentages[regionName];
                if (percentage !== undefined) {
                    originalColors[regionName] = colorScale(percentage);

                    d3.select(this)
                        .attr("fill", originalColors[regionName])
                        .attr("stroke", "#fff")
                        .attr("stroke-width", "0.5")
                        .on("mouseover", function () {
                            d3.select(this)
                                .classed("highlighted-region", true);

                            labelsGroup.selectAll("text")
                                .filter(t => t === regionName)
                                .classed("highlighted-label", true);

                            const regionData = housingData.homelessness_data.regional_data.find(d => d.region === regionName);

                            hoverPanel.select(".region-name").text(regionName);

                            const statsHTML = `
                                <div>The severely housing deprived population in Aotearoa is made up of three categories; 
                                those without any shelter, those who have been temporarily placed in accomodation, and those  
                                placed in shared accomodation.</div>
                                <div>Of all <strong>Total Severely Housing Deprived</strong>, <strong>${regionName} </strong> holds:</div>
                                <div><strong>${withoutPercentages[regionName].toFixed(1)}% 
                                    </strong> <strong>Without Shelter</strong></div>
                                <div><strong>${temporaryPercentages[regionName].toFixed(1)}% 
                                    </strong> in <strong>Temporary Accomodation</strong></div>
                                <div><strong>${sharingPercentages[regionName].toFixed(1)}% 
                                    </strong> that are <strong>Sharing Accomodation</strong></div>
                                <div><strong>${regionData.total_severely_housing_deprived.percentage.toFixed(1)}%</strong> of all <strong>Total Severely Housing Deprived</strong> in Aotearoa</div>
                            `;

                            hoverPanel.select(".hover-stats").html(statsHTML);
                        })
                        .on("mouseout", function () {
                            d3.select(this)
                                .classed("highlighted-region", false);

                            labelsGroup.selectAll("text")
                                .classed("highlighted-label", false);

                            const nationalData = getNationalStats();
                            hoverPanel.select(".region-name").text("AOTEAROA");

                            const statsHTML = `
                                <div>The severely housing deprived population in Aotearoa is made up of three categories; 
                                those without any shelter, those who have been temporarily placed in accomodation, and those  
                                placed in shared accomodation.</div>
                                <div>Of all <strong>Total Severely Housing Deprived</strong>, there are:</div>
                                <div><strong>${nationalData.categories.without_shelter.percentage.toFixed(1)}% 
                                    </strong> <strong>Without Shelter</strong></div>
                                <div><strong>${nationalData.categories.temporary_accommodation.percentage.toFixed(1)}% 
                                    </strong> in <strong>Temporary Accomodation</strong></div>
                                <div><strong>${nationalData.categories.sharing_accommodation.percentage.toFixed(1)}% 
                                    </strong> that are <strong>Sharing Accomodation</strong></div>
                            `;

                            hoverPanel.select(".hover-stats").html(statsHTML);
                        });

                    if (labelPositions[regionName]) {
                        const [labelX, labelY] = labelPositions[regionName];

                        const label = labelsGroup.append("text")
                            .attr("x", labelX)
                            .attr("y", labelY)
                            .attr("text-anchor", "middle")
                            .attr("fill", "white")
                            .attr("font-size", labelSizes[regionName])
                            .attr("font-weight", "bold")
                            .style("font-family", "Copperplate")
                            .attr("transform", `rotate(${labelRotations[regionName]}, ${labelX}, ${labelY})`)
                            .text(regionName.toUpperCase());

                        label.each(function () { this.__data__ = regionName; });

                        const [x1, y1, x2, y2, percent] = linePositions[regionName];
                        labelsGroup.append("line")
                            .attr("x1", x1)
                            .attr("y1", y1)
                            .attr("x2", x2)
                            .attr("y2", y2)
                            .attr("stroke", "white")
                            .attr("stroke-width", 1);

                        labelsGroup.append("circle")
                            .attr("cx", x1)
                            .attr("cy", y1)
                            .attr("r", 2)
                            .attr("fill", "white");

                        labelsGroup.append("text")
                            .attr("x", percent)
                            .attr("y", y2 + 3)
                            .attr("text-anchor", "middle")
                            .attr("fill", "white")
                            .attr("font-size", "8px")
                            .text(`${percentage.toFixed(1)}%`);
                    }
                }
            });
        }

    }).catch(function (error) {
        console.error("Error loading SVG file:", error);
    });
};
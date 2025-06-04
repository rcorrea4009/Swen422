const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const COLORS = {
    withoutShelter: '#e41a1c',
    temporaryAccommodation: '#377eb8',
    sharingAccommodation: '#4daf4a'
};

const DOTS_PER_PERSON = 0.1;
const PEOPLE_PER_ICON = 100;
let allData = null;
let currentFilter = 'all';

// Color scale for severity
const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, 100]);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        allData = await d3.json('data/HousingAgeGenderEthnic.json');
        renderVisualizations(allData);
        // Setup filter buttons
        setupFilters();
    } catch (error) {
        handleError(error);
    }
});

// buttons to go between different data caterogories
function setupFilters() {
    const filterContainer = d3.select('#filters')
        .style('background', 'white')
        .style('padding', '15px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');

    filterContainer.append('h3')
        .text('Filter Data By:')
        .style('margin', '0 0 10px 0')
        .style('color', '#333')
        .style('font-size', '1.1em');

    const buttonGroup = filterContainer.append('div')
        .attr('class', 'filter-button-group');

    const buttons = [
        { label: 'All Data', filter: 'all', icon: 'fa-table' },
        { label: 'Gender', filter: 'Sex', icon: 'fa-venus-mars' },
        { label: 'Age', filter: 'Age (years)', icon: 'fa-users' },
        { label: 'Ethnicity', filter: 'Ethnicity', icon: 'fa-globe-asia' }
    ];

    buttonGroup.selectAll('.filter-btn')
        .data(buttons)
        .enter()
        .append('button')
        .attr('class', 'filter-btn')
        .html(d => `<i class="fas ${d.icon}"></i> ${d.label}`)
        .on('click', function(_, d) {
            d3.selectAll('.filter-btn').classed('active', false);
            d3.select(this).classed('active', true);
            currentFilter = d.filter;
            const filteredData = filterData(allData, currentFilter);
            renderVisualizations(filteredData);
        })
        .classed('active', d => d.filter === 'all');
}

function filterData(data, filterType) {
    const container = d3.select('#visualizations');
    container.html('');
    if (filterType === 'all') return data;
    return {
        data: data.data.filter(item => item.characteristic === filterType)
    };
}

function renderVisualizations(data) {
    const container = d3.select('#visualizations');
    container.html('');
    
    if (!data || !data.data) return;

    // Remove any existing age filters first
    container.selectAll('.age-filter-container').remove();
    const ageCharacteristic = data.data.find(d => d.characteristic === "Age (years)");
    
    // Only proceed if Age (years) is selected
    if (currentFilter === "Age (years)") {
        if (ageCharacteristic) {
            // buttons for the different ages
            renderAgeFilters(container, ageCharacteristic);
        }
    }

    // Render the selected data
    data.data.forEach(characteristic => {
        if (characteristic.characteristic === currentFilter || currentFilter === "all") {
            if (characteristic.characteristic === "Sex") {
                renderSexVisualization(container, characteristic);
            }
            else if (characteristic.characteristic === "Age (years)") {
                // Only show all groups if no specific age is selected
                if (!ageCharacteristic.selectedAgeGroup || ageCharacteristic.selectedAgeGroup === "all") {
                    filterAgeGroups(ageCharacteristic, "all");
                }
            }else if (characteristic.characteristic === "Ethnicity") {
    renderEthnicityVisualization(container, characteristic);
    }
        }
    });
}

/** Gender visualizations */
function renderSexVisualization(container, characteristic) {
    const vizContainer = container.append('div')
        .attr('class', 'visualization-container');
    
    vizContainer.append('h2')
        .text(characteristic.characteristic);
    
    const maleData = characteristic.categories.find(c => c.category === "Male");
    const femaleData = characteristic.categories.find(c => c.category === "Female");
    
    if (!maleData || !femaleData) return;
    
    // Create separate sections for each gender
    const maleSection = vizContainer.append('div')
        .attr('class', 'gender-section male-section');
    
    maleSection.append('h3')
        .html('<i class="fas fa-male"></i> Male');
    
    const maleMatrix = maleSection.append('div')
        .attr('class', 'gender-matrix male-matrix');
    
    renderGenderIcons(maleMatrix, maleData, 'male');
    
    const femaleSection = vizContainer.append('div')
        .attr('class', 'gender-section female-section');
    
    femaleSection.append('h3')
        .html('<i class="fas fa-female"></i> Female');
    
    const femaleMatrix = femaleSection.append('div')
        .attr('class', 'gender-matrix female-matrix');
    
    renderGenderIcons(femaleMatrix, femaleData, 'female');
    
    // Add combined legend and total
    renderSexLegend(vizContainer, maleData, femaleData);
}

function renderGenderIcons(container, data, gender) {
    // Create separate groups for each housing type
    const housingTypes = [
        { key: 'without_shelter', label: 'Without Shelter' },
        { key: 'temporary_accommodation', label: 'Temporary Accommodation' },
        { key: 'sharing_accommodation', label: 'Sharing Accommodation' }
    ];
    
    housingTypes.forEach(type => {
        // Add housing type label
        container.append('div')
            .attr('class', 'housing-type-label')
            .text(type.label);
        
        // Create container for icons
        const iconContainer = container.append('div')
            .attr('class', 'icon-container');
        
        // Calculate number of icons to show
        const count = Math.ceil(data[type.key].number / PEOPLE_PER_ICON);
        const color = COLORS[type.key.split('_').join('')];
        
        // Add icons
        for (let i = 0; i < count; i++) {
            iconContainer.append('div')
                .attr('class', `gender-icon ${gender}`)
                .html(gender === 'male' 
                    ? `<i class="fas fa-male" style="color: ${color}"></i>`
                    : `<i class="fas fa-female" style="color: ${color}"></i>`)
                .attr('title', `${gender}: ${data[type.key].number.toLocaleString()} ${type.label.toLowerCase()} (${data[type.key].percentage}%)`);
        }
    });
}

function getBodyIcon(gender, color) {
    if (gender === 'male') {
        return `<i class="fas fa-male" style="color: ${color}"></i>`;
    } else {
        return `<i class="fas fa-female" style="color: ${color}"></i>`;
    }
}

function renderSexLegend(container, maleData, femaleData) {
    const legend = container.append('div')
        .attr('class', 'legend');
    
    // Male legend
    legend.append('div')
        .attr('class', 'legend-item')
        .html(`
            <span>Male - Without Shelter: ${maleData.without_shelter.number.toLocaleString()} (${maleData.without_shelter.percentage}%)</span>
        `);
    
    legend.append('div')
        .attr('class', 'legend-item')
        .html(`
            <span>Male - Temporary Accommodation: ${maleData.temporary_accommodation.number.toLocaleString()} (${maleData.temporary_accommodation.percentage}%)</span>
        `);
    
    legend.append('div')
        .attr('class', 'legend-item')
        .html(`
            <span>Male - Sharing Accommodation: ${maleData.sharing_accommodation.number.toLocaleString()} (${maleData.sharing_accommodation.percentage}%)</span>
        `);
    
    // Female legend
    legend.append('div')
        .attr('class', 'legend-item')
        .html(`
            <span>Female - Without Shelter: ${femaleData.without_shelter.number.toLocaleString()} (${femaleData.without_shelter.percentage}%)</span>
        `);
    
    legend.append('div')
        .attr('class', 'legend-item')
        .html(`
            <span>Female - Temporary Accommodation: ${femaleData.temporary_accommodation.number.toLocaleString()} (${femaleData.temporary_accommodation.percentage}%)</span>
        `);
    
    legend.append('div')
        .attr('class', 'legend-item')
        .html(`
            
            <span>Female - Sharing Accommodation: ${femaleData.sharing_accommodation.number.toLocaleString()} (${femaleData.sharing_accommodation.percentage}%)</span>
        `);
    
    // Total
    container.append('div')
        .attr('class', 'total-display')
        .text(`Total severely housing deprived: ${maleData.total_severely_housing_deprived.number + femaleData.total_severely_housing_deprived.number} people`);
}

/** Age Visualizations */
function filterAgeGroups(ageCharacteristic, selectedKey) {
    const container = d3.select('#visualizations');
    // Clear previous visualizations
    container.selectAll('.age-group-card').remove();

    if (selectedKey === 'all') {
        // Show all age groups
        ageCharacteristic.categories.forEach(category => {
            renderAgeGroupVisualization(container, category);
        });
    } else {
        // Find and show only the selected age group
        const ageGroup = ageCharacteristic.categories.find(c => c.category === selectedKey);
        if (ageGroup) {
            renderAgeGroupVisualization(container, ageGroup);
        }
    }
}

function renderAgeFilters(container, ageCharacteristic) {
    const filterContainer = container.append('div')
        .attr('class', 'age-filter-container')
        .style('background', 'white')
        .style('padding', '15px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
        .style('margin', '20px 0');

    filterContainer.append('h3')
        .text('Filter Age Groups:')
        .style('margin', '0 0 10px 0')
        .style('color', '#333')
        .style('font-size', '1.1em');

    const ageGroups = [
        { label: "All Ages", key: "all", icon: "fa-users" },
        { label: "Children (<15)", key: "<15", icon: "fa-child" },
        { label: "Youth (15-24)", key: "15-24", icon: "fa-user-graduate" },
        { label: "Young Adults (25-34)", key: "25-34", icon: "fa-user-tie" },
        { label: "Adults (35-44)", key: "35-44", icon: "fa-user" },
        { label: "Middle Age (45-64)", key: "45-64", icon: "fa-user-friends" },
        { label: "Seniors (65+)", key: "65+", icon: "fa-user-alt" }
    ];

    const buttonGroup = filterContainer.append('div')
        .attr('class', 'age-button-group');

    buttonGroup.selectAll('.age-filter-btn')
        .data(ageGroups)
        .enter()
        .append('button')
        .attr('class', 'age-filter-btn')
        .html(d => `<i class="fas ${d.icon}"></i> ${d.label}`)
        .on('click', function(_, d) {
            d3.selectAll('.age-filter-btn').classed('active', false);
            d3.select(this).classed('active', true);
            filterAgeGroups(ageCharacteristic, d.key);
        })
        .classed('active', d => d.key === 'all');
}

function renderAgeGroupVisualization(container, ageData) {
    const ageGroupContainer = container.append('div')
        .attr('class', `age-group-card ${ageData.category.replace(/\s+/g, '-')}`)
        .style('border-left', `5px solid ${getAgeGroupColor(ageData.category)}`);

    // Header with age-specific icon
    const header = ageGroupContainer.append('div')
        .attr('class', 'age-group-header');
    
    header.append('div')
        .attr('class', 'age-group-title')
        .html(`<i class="fas fa-user-tag"></i> ${ageData.category} Years`);
    
    // Stats summary
    const stats = ageGroupContainer.append('div')
        .attr('class', 'age-group-stats');
    
    // Housing type breakdown
    const housingTypes = [
        { key: 'without_shelter', icon: 'fa-homeless', iconClass: 'fas fa-house-damage' },
        { key: 'temporary_accommodation', icon: 'fa-building', iconClass: 'fas fa-hotel' },
        { key: 'sharing_accommodation', icon: 'fa-users', iconClass: 'fas fa-user-friends' }
    ];
    
    housingTypes.forEach(type => {
        const statItem = stats.append('div')
            .attr('class', 'stat-item');
        
        statItem.append('div')
            .attr('class', 'stat-icon')
            .html(`<i class="fas ${type.icon}"></i>`)
            
        const statContent = statItem.append('div')
            .attr('class', 'stat-content');
            
        statContent.append('div')
            .attr('class', 'stat-label')
            .text(type.key.split('_').join(' '));
            
        statContent.append('div')
            .attr('class', 'stat-value')
            .text(`${ageData[type.key].number.toLocaleString()} (${ageData[type.key].percentage}%)`);
    });
    
    // Interactive dot matrix
    const matrixContainer = ageGroupContainer.append('div')
        .attr('class', 'matrix-container');
    
    matrixContainer.append('div')
        .attr('class', 'matrix-label')
        .text('Visual Representation:');
    
    const matrix = matrixContainer.append('div')
        .attr('class', 'dot-matrix');
    
    housingTypes.forEach(type => {
        const count = Math.round(ageData[type.key].number * DOTS_PER_PERSON * 2); // More dots for visibility
        
        for (let i = 0; i < count; i++) {
            if (type.key === 'without_shelter') {
                // Use red dots for "without shelter"
                matrix.append('div')
                    .attr('class', 'matrix-dot')
                    .style('background-color', COLORS.withoutShelter)
                    .attr('title', `${ageData.category}: ${type.key.split('_').join(' ')}\n${ageData[type.key].number} people`);
            } else {
                // Use icons for other housing types
                matrix.append('div')
                    .attr('class', 'matrix-icon')
                    .html(`<i class="${type.iconClass}" style="color: ${type.key === 'temporary_accommodation' ? COLORS.temporaryAccommodation : COLORS.sharingAccommodation}"></i>`)
                    .attr('title', `${ageData.category}: ${type.key.split('_').join(' ')}\n${ageData[type.key].number} people`);
            }
        }
    });
    
    // Total summary
    ageGroupContainer.append('div')
        .attr('class', 'age-group-total')
        .html(`<strong>Total:</strong> ${ageData.total_severely_housing_deprived.number.toLocaleString()} people`);
}

function getAgeGroupColor(ageGroup) {
    // Color coding by age ranges
    const colors = {
        '<15': '#FF9AA2',  // Light red
        '15-24': '#FFB7B2', // Coral
        '25-34': '#FFDAC1', // Peach
        '35-44': '#E2F0CB', // Light green
        '45-64': '#B5EAD7', // Mint
        '65+': '#C7CEEA'   // Lavender
    };
    return colors[ageGroup] || '#CCCCCC';
}

/** Ethnicity Visualization */
function renderEthnicityVisualization(container, characteristic) {
    const vizContainer = container.append('div')
        .attr('class', 'ethnicity-container')
        .style('background', '#fff')
        .style('border-radius', '8px')
        .style('padding', '20px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)');

    // Header with icon
    vizContainer.append('h2')
        .html('<i class="fas fa-globe-asia"></i> Ethnicity Breakdown')
        .style('color', '#333')
        .style('margin-bottom', '20px')
        .style('border-bottom', '1px solid #eee')
        .style('padding-bottom', '10px');

    // Create a grid layout for ethnic groups
    const ethnicGrid = vizContainer.append('div')
        .attr('class', 'ethnic-grid');

    characteristic.categories.forEach(ethnicity => {
        const ethnicCard = ethnicGrid.append('div')
            .attr('class', 'ethnic-card')
            .style('border-left', `4px solid ${getEthnicityColor(ethnicity.category)}`);

        // Ethnicity header
        ethnicCard.append('h3')
            .text(ethnicity.category)
            .style('color', '#333')
            .style('margin', '0 0 10px 0')
            .style('display', 'flex')
            .style('align-items', 'center');

        // Stats summary
        const stats = ethnicCard.append('div')
            .attr('class', 'ethnic-stats');

        // Dot matrix container
        const matrixContainer = ethnicCard.append('div')
            .style('margin-top', '15px');

        matrixContainer.append('div')
            .attr('class', 'matrix-label')
            .text('Each dot represents 10 people:');

        const matrix = matrixContainer.append('div')
            .attr('class', 'ethnic-dot-matrix');

        // Create dots for each category
        ['without_shelter', 'temporary_accommodation', 'sharing_accommodation'].forEach(type => {
            // Get the correct color key
            let colorKey;
            if (type === 'without_shelter') colorKey = 'withoutShelter';
            else if (type === 'temporary_accommodation') colorKey = 'temporaryAccommodation';
            else if (type === 'sharing_accommodation') colorKey = 'sharingAccommodation';
            
            const color = COLORS[colorKey];
            const count = Math.max(1, Math.round(ethnicity[type].number / 10)); // Ensure at least 1 dot
            
            for (let i = 0; i < count; i++) {
                matrix.append('div')
                    .attr('class', 'ethnic-dot')
                    .style('background-color', color)
                    .style('border', `1px solid ${darkenColor(color, 20)}`) // Add border for better visibility
                    .attr('title', `${ethnicity.category}: ${ethnicity[type].number.toLocaleString()} ${type.split('_').join(' ')} (${ethnicity[type].percentage}%)`);
            }
        });
        
        // Add this helper function to darken colors for borders
        function darkenColor(color, percent) {
            // Simple color darkening function
            return d3.color(color).darker(percent/100);
        }

        // Total display
        ethnicCard.append('div')
            .attr('class', 'ethnic-total')
            .html(`<strong>Total:</strong> ${ethnicity.total_severely_housing_deprived.number.toLocaleString()} people`);
    });
}

function getEthnicityColor(ethnicity) {
    const colors = {
        'European': '#4e79a7',
        'Māori': '#e15759',
        'Pacific': '#76b7b2',
        'Asian': '#f28e2b',
        'MELAA': '#59a14f',
        'Other': '#edc948'
    };
    return colors[ethnicity] || '#bab0ac';
}
const width = 1400;
const height = 700;
let currentRoot = null; 

//Function to load data 
async function loadData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
    
  } catch (error) {
    console.error('Failed to load JSON data:', error);
  }
}

// Tiling function adapts for the appropriate 
// aspect ratio when the treemap is zoomed-in.
function tile(node, x0, y0, x1, y1) {
  d3.treemapBinary(node, 0, 0, width, height);
  for (const child of node.children) {
    child.x0 = x0 + child.x0 / width * (x1 - x0);
    child.x1 = x0 + child.x1 / width * (x1 - x0);
    child.y0 = y0 + child.y0 / height * (y1 - y0);
    child.y1 = y0 + child.y1 / height * (y1 - y0);
  }
}

function createTreeMap(data){
  // Compute the layout.
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.count || 0)
    .sort((a, b) => b.count - a.count);
    
  const root = d3.treemap().tile(tile)(hierarchy);

  // Create the scales.
  const x = d3.scaleLinear().rangeRound([0, width]);
  const y = d3.scaleLinear().rangeRound([0, height]);

  // Color scale for top categories
  const topCategories = data.children.map(d => d.name);
  const color = d3.scaleOrdinal(d3.schemeTableau10).domain(topCategories);

  // Edit the SVG container.
  const svg = d3.select("#tree")
      .attr("style", "max-width: 100%; height: auto;")
      .style("font", "10px sans-serif");

  // Display the root.
  let group = svg.append("g")
      .call(render, root);

  function render(group, root) {
    const node = group
      .selectAll("g")
      .data(root.children.concat(root))
      .join("g");

    // Filter for clickable nodes and trigger zoomIn 
    node.filter(d => d === root ? d.parent : d.children)
        .attr("class", "clickable-node") 
        .attr("cursor", "pointer")
        .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

    node.append("rect")
        .attr("class", "node") 
        .attr("fill", d => getNodeColor(d));

    node.append("text")
        .attr("class", "node-label") 
        .attr("x", 20)
        .attr("y", 30)
        .text(d => d.data.name);

    // Second label for count
    node.append("text")
      .attr("class", "node-label") 
      .attr("x", 20)
      .attr("y", 50)
      .text(d => d.data.count || d.data.total_count); 

    group.call(position, root);
    currentRoot = root; // for colour 
    updateBackButtonVisibility()
  }

  // Function to position/transform nodes based on the group they're in
  function position(group, root) {
    group.selectAll("g")
        .attr("transform", d => d === root ? `translate(0,-50)` : `translate(${x(d.x0)},${y(d.y0)})`)
      .select("rect")
        .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
        .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.append("g").call(render, d);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .call(position, d.parent))
        .call(t => group1.transition(t)
          .attrTween("opacity", () => d3.interpolate(0, 1))
          .call(position, d));
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.insert("g", "*").call(render, d.parent);

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .attrTween("opacity", () => d3.interpolate(1, 0))
          .call(position, d))
        .call(t => group1.transition(t)
          .call(position, d.parent));
  }

  // Makes the treemap color lighter which each zoom
  function getNodeColor(d) {
    if (!d.parent) { return "#ffffff";}  // Root node white
  
    // Color scale for top categories
    const topCategory = d.ancestors().slice(-2, -1)[0]?.data.name;
    const baseColor = color(topCategory);
    const depthFactor = d.depth / 7; // how deep this node is (root = 0)
  
    // Interpolate between color and white
    return d3.interpolateRgb(baseColor, "#f7f7f7")(depthFactor);
  }

  function updateBackButtonVisibility() {
      const backButton = document.getElementById("backButton")
      backButton.style.visibility = currentRoot?.parent ? "visible" : "hidden";
  };

  //Back button event listener 
  document.getElementById("backButton").addEventListener("click", () => {
    if (currentRoot?.parent) { // same as if (currentRoot && currentRoot.parent)
      zoomout(currentRoot);
    }
  });
}

// Select the dark mode toggle button and the root element
const toggleButton = document.getElementById('toggleDarkMode');
const root = document.documentElement;  // :root

// Add click event listener to toggle dark mode
toggleButton.addEventListener('click', () => {
    root.classList.toggle('darkmode');
});

document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadData("data/housingbycategory.json");
  createTreeMap(data.data);
});


/* References
https://observablehq.com/@d3/zoomable-treemap
https://observablehq.com/@andyburnett/d3-zoomable-treemap
https://codepen.io/figle/pen/qapRZQ */
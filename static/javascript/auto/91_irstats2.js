/* D3 Graphs and Widgets */

// Generates a single number from the data and writes it to an element
var EPJS_Stats_NumberCard = Class.create(EPJS_Stats, {
 
        initialize: function($super,params) {
        $super( params );
        this.view = 'Google::Graph';
        this.draw();
    },

    ajax: function($super,response) {
        $super();
        var data = response.responseText.evalJSON().data;
        var total = 0;
        data.forEach( d=> total = total + d[1]);
        var container = $( this.container_id );
        container.appendChild(document.createTextNode(total));
    }
});

// D3 bar chart
var EPJS_Stats_D3Bars = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        this.view = 'Google::Graph';
        this.draw();
    },

    ajax: function($super,response) {

        $super();

        // Declare the chart dimensions and margins.
        const margin = { top: 30, right: 20, bottom: 30, left: 40 };

        var width = 400 - margin.left - margin.right;
        var height = 300 - margin.top - margin.bottom;

        var data = response.responseText.evalJSON().data;

        // Calculate the inner width and height of the chart area
        var innerWidth = width - margin.left - margin.right;
        var innerHeight = height - margin.top - margin.bottom;
        
        // normalise the dates
        const parseDate = d3.utcParse('%b %Y');
        data.forEach(d => d[0] = parseDate(d[0]));

        //format the dates
        const formatDate = d3.utcFormat("%b, %Y");

        const xScale = d3.scaleBand()
            .domain(data.map(d => d[0]))
            .range([0, innerWidth])
            .padding(0.1);
        const xAxis = d3.axisBottom(xScale)
            //.tickValues(d3.range(12)) // Set the tick values to represent each month
            .tickFormat(formatDate); // Format the tick labels to display month abbreviation

        // Declare the y (vertical position) scale.
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => d[1])])
            .range([innerHeight, 0]);

        // Create the y-axis
        const yAxis = d3.axisLeft(yScale).scale(yScale);

        // Create the SVG container.
        const svg = d3.create("svg")
           .attr("width", width)
           .attr("height", height);
           //.attr("style", "max-width: 100%; height: auto;");

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const bars = g.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d[0]))
            .attr('y', d => yScale(d[1]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => innerHeight - yScale(d[1]))
            .attr('fill', '#621244');
        // Add x-axis
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis);

        // Add y-axis
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        // Create tooltips
        const bar_tooltip = d3.select('#downloads_tooltip');

        // Add mouseover event handler to display tooltip
        bars.on('mouseover', function(d) {
            const value = d.target.__data__[1];
            const key = formatDate(d.target.__data__[0]);
            bar_tooltip.transition().duration(200).style('opacity', .9);
            bar_tooltip.html(`${key}: ${value}`)
                .style('left', (d.layerX) + 'px')
                .style('top', (d.layerY - 28) + 'px');
        });

        // Add mouseout event handler to hide tooltip
        bars.on('mouseout', function(d) {
            bar_tooltip.transition().duration(500).style('opacity', 0);
        });

        var container = $( this.container_id );
        container.append(svg.node());

        // and finally handle resizing the window

        // Function to update chart dimensions and redraw bars
        function resize() {
            // Update width and height based on window size
            var width = parseInt(d3.select("#irstats2_summary_page_d3_downloads").style("width"));
            var height = 300;

            var innerWidth = width - margin.left - margin.right;
            var innerHeight = height - margin.top - margin.bottom;

            // Update SVG container size
            svg.attr("width", width)
                .attr("height", height);

            // Update scales based on new dimensions
            xScale.range([0, innerWidth]);
            yScale.range([innerHeight, 0]);

            // Redraw the bars
            svg.selectAll("rect")
                .attr("x", function(d) { return xScale(d[0]); })
                .attr("width", xScale.bandwidth())
                .attr("y", function(d) { return yScale(d[1]); })
                .attr("height", function(d) { return innerHeight - yScale(d[1]); });

            // Redraw x axis
            svg.select(".x-axis")
                .attr("transform", "translate(0," + innerHeight + ")")
                .call(xAxis);

            // Redraw y axis
            svg.select(".y-axis")
                .call(yAxis);
        }

        // Listen for window resize events
        window.addEventListener("resize", resize);
        resize();
    }
});

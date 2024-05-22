/* D3 Graphs and Widgets */

/* Takes a numerical response from a Cached stats view and
 * displays it using a counting up animation */
var EPJS_Stats_Ticker = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        this.view = 'Cached';
        this.draw();
    },

    ajax: function($super,response) {
        $super(response);
        
        var html = response.responseText;
        
        var $container = $( this.container_id );

        // Counter returns us the result in text that looks like HTML
        // So convert this into proper HTML so we can get the value
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");

        var value = dom.querySelector('.irstats2_counter_value').innerHTML;

        // configure the counting animation
        var duration = 1250;
        var interval = 50;

        var currentCount = 0;
        var step = Math.ceil(value / (duration / interval));
        var timer = setInterval(function(){
            currentCount += step;
            if(currentCount >= value){
                clearInterval(timer);
                currentCount = value;
            }
            $container.update(formatNumberWithCommas(currentCount));
        }, interval);
    }
});

// D3 bar chart
/* A dynamic downloads bar graph that shows all time downloads, 
 * either by day, month or years depending on how far back the
 * data goes (i.e. more than a month, show months, more than 
 * 24 months, show years)
 */
var EPJS_Stats_D3Bars = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        this.view = 'D3::Graph';
        this.draw();
    },

    ajax: function($super,response) {

        $super();

        // Declare the chart dimensions and margins.
        const margin = { top: 30, right: 30, bottom: 30, left: 40 };

        var width = 400 - margin.left - margin.right;
        var height = 300 - margin.top - margin.bottom;

        // Calculate the inner width and height of the chart area
        var innerWidth = width - margin.left - margin.right;
        var innerHeight = height - margin.top - margin.bottom;
 
        // get the data
        var data = response.responseText.evalJSON().data;
        
        // normalise the dates
        const parseDate = d3.timeParse('%d %b %Y');
        data.forEach(d => d[0] = parseDate(d[0]))

        // calculate data range
        var dataRange = [
            d3.min(data, function(d) { return d[0]; }),
            d3.max(data, function(d) { return d[0]; })
        ];

        // how many days and months in the range
        var diffInDays = d3.timeDay.count(dataRange[0], dataRange[1]);
        var diffInMonths = d3.timeMonth.count(dataRange[0], dataRange[1]);        


        // Determine appropriate tick count based on available width and data range

        // work out what granularity we're dealing with
        if( diffInDays <= 31 )
        {  
            /*** day granularity ***/
            // place the tick in the centre of the day
            tickCentres = data.map(function(d, i) {
                return getMidDay(d[0]);                
            });

            // centre the bars
            calculateXPosition = function(d, i) {
                return xScale(getMidDay(d[0])) - (barWidth / 2);
            };

            // add a half day to either end of the graph to space things out nicely
            graphRange = [
                getMidDay(d3.timeDay.offset(d3.min(data, function(d) { return d[0]; }), -1)),
                getMidDay(d3.timeDay.offset(d3.max(data, function(d) { return d[0]; }), 1 ))
            ];

            // display format - day format can get cluttered, only display first and last days
            formatDate = d3.timeFormat("%d %b, %Y");
            tickFormat = function(d, i){
                if( i == 0 || i == data.length-1 )
                {
                    return formatDate(d);
                }
                else
                {
                    return "";
                }
            }         
        }
        else
        {
            /*** Month granularity ***/
            // Group data by month
            var dataByMonth = d3.group(data, function(d) {
                return d3.timeMonth(d[0]);
            });

            // Convert data to group values by month
            data = Array.from(dataByMonth.entries()).map(function([key, value]) {             
                return [
                    key,
                    d3.sum(value, function(d) { return d[1]; })
                ];
            });

            // Calculate the middle of each month
            tickCentres = data.map(function(d) {
                return getMidMonth(d[0]);
            });

            // change how we format dates
            formatDate = d3.timeFormat("%b, %Y");
            tickFormat = function(d, i){
                if( i == 0 || i == data.length-1 )
                {
                    return formatDate(d);
                }
                else
                {
                    return "";
                }
            }

            // and update our range - we need add a half month to each side of the x-axis to pad things out nicely
            graphRange = [
                getMidMonth(d3.timeMonth.offset(d3.min(data, function(d) { return d[0]; }), -1)),
                getMidMonth(d3.timeMonth.offset(d3.max(data, function(d) { return d[0]; }), 1 ))
            ];


            // update our bar positioning to work nicely for months
            calculateXPosition = function(d, i) {
                return xScale(getMidMonth(d[0])) - (barWidth / 2);
            };
        }

        // and calculate a new bar width
        barWidth = (innerWidth/(data.length+1)) - 2;

        // function to calculate number of ticks
        tickCount = Math.min(Math.ceil(data.length / (innerWidth / 75)), data.length+1);          

        // generate xScale using up to date range
        xScale = d3.scaleTime()
            .domain(graphRange)
            .range([0, innerWidth]);

        // calculate our x-axis for month based granularity
        xAxis = d3.axisBottom(xScale)
            .tickFormat(tickFormat) // Format the tick labels to display month abbreviation
            .tickValues(tickCentres);

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

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const bars = g.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', calculateXPosition)
            .attr('y', d => yScale(d[1]))
            .attr('width', barWidth)
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
        container.update(svg.node());

        // and finally handle resizing the window

        // Function to update chart dimensions and redraw bars
        function resize() {
            // Update width and height based on window size
            var width = parseInt(d3.select("#irstats2_summary_page_d3_downloads").style("width"));
            var height = 300;

            var innerWidth = width - margin.left - margin.right;
            var innerHeight = height - margin.top - margin.bottom;

            // and calculate a new bar width
            barWidth = (innerWidth/(data.length+1))-2;

            // Update SVG container size
            svg.attr("width", width).attr("height", height);

            // Update scales based on new dimensions
            xScale.range([0, innerWidth]);
            yScale.range([innerHeight, 0]);

            // Redraw the bars
            svg.selectAll("rect")
                .transition()
                .attr("x", function(d) { return xScale(d[0]); })
                .attr("width", barWidth)
                .attr("y", function(d) { return yScale(d[1]); })
                .attr("height", function(d) { return innerHeight - yScale(d[1]); });

            // Redraw x axis
            svg.select(".x-axis")
                .transition()
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

/* Utility Functions for the above widgets and graphs */

// Funtion to get middle of the month (roughly)
function getMidMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 15);
}

// Function to get the middle of a day
function getMidDay(date) {
    // Clone the date to avoid modifying the original
    var midDay = new Date(date);
    // Set the time to the middle of the day (12:00 PM)
    midDay.setHours(12, 0, 0, 0);
    return midDay;
}

// display number in a nice, human-readable way
function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

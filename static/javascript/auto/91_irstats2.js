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
        var value = response.responseText.evalJSON();
        var $container = $( this.container_id );

        var show_percentage = 0;
        if( typeof this.options.get("display") !== 'undefined' && this.options.get("display") === 'percentage' )
        {
            show_percentage = 1;
        }

        // Counter returns us the result in text that looks like HTML
        // So convert this into proper HTML so we can get the value
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, "text/html");
        // configure the counting animation
        var duration =  1250;
        if( typeof this.options.get("duration") !== 'undefined' )
        {
            duration = this.options.get("duration");
        }
        var interval = 50;

        if( duration > 0 )
        {
            var currentCount = 0;
            var step = Math.ceil(value / (duration / interval));
            var timer = setInterval(function(){
                currentCount += step;
                if(currentCount >= value){
                    clearInterval(timer);
                    currentCount = value;
                }            
                if( show_percentage )
                {
                    $container.update(formatNumberWithCommas(currentCount)+"%");
                }
                else
                {
                    $container.update(formatNumberWithCommas(currentCount));
                }
            }, interval);
        }
        else
        {
            if( show_percentage )
            {
                $container.update(formatNumberWithCommas(value)+"%");
            }
            else
            {
                $container.update(formatNumberWithCommas(value));
            }
        }
    }
});

var EPJS_Cached_Table = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        this.view = 'Cached';
        this.draw();
    },

    ajax: function($super,response) {
        $super(response);
        const values = response.responseText.evalJSON();

        const $container = $( this.container_id );

        const table = document.createElement("table");
        table.className = "mdc-data-table__table";

        const tbody = document.createElement("tbody");
        tbody.className = "mdc-data-table__content";

        values.slice(0,5).forEach(item => {
            const row = document.createElement("tr");
            row.className = "mdc-data-table__row";

            const cell_label = document.createElement("th");
            cell_label.className = "mdc-data-table__header-cell";
            cell_label.textContent = item.set_value;
            row.appendChild(cell_label);

            const cell_value = document.createElement("td");
            cell_value.className = "mdc-data-table__cell";
            cell_value.textContent = formatNumberWithCommas(item.count);
            row.appendChild(cell_value);

            tbody.appendChild(row);
          });
        table.appendChild(tbody);
        $container.update(table);
     }      
});

var EPJS_EPrint_Table = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        this.view = 'Cached';
        this.draw();
    },

    ajax: function($super,response) {
        $super(response);
        const values = response.responseText.evalJSON();
    
        values.sort(function(a,b){return a.count - b.count});
        values.reverse();

        const $container = $( this.container_id );

        const table = document.createElement("table");
        table.className = "mdc-data-table__table";

        const tbody = document.createElement("tbody");
        tbody.className = "mdc-data-table__content";

        values.slice(0,5).forEach(item => {
            const row = document.createElement("tr");
            row.className = "mdc-data-table__row";

            const cell_label = document.createElement("th");
            cell_label.className = "mdc-data-table__header-cell";

            const link = document.createElement("a");
            link.href = item.link;
            link.textContent = item.citation;
            link.title = item.citation;

            cell_label.appendChild(link);
            row.appendChild(cell_label);

            const cell_value = document.createElement("td");
            cell_value.className = "mdc-data-table__cell";
            cell_value.textContent = formatNumberWithCommas(item.count);
            row.appendChild(cell_value);

            tbody.appendChild(row);
          });
        table.appendChild(tbody);
        $container.update(table);
     }      
});

var EPJS_Cached_Columns = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        
        this.view = 'Cached';
        this.draw();
    },

    ajax: function($super,response) {
        $super(response);
        const data = response.responseText.evalJSON();

        const $container = $( this.container_id );

        const width = 1000;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        
        const svg = d3.select("#monthly_downloads_svg");
    
        const tickCount = 10;
        const step = Math.ceil(data.length / tickCount);

        const bar_tooltip = d3.select('#downloads_tooltip');

        const xTickValues = data
                  .filter((d, i) => i % step === 0)
                    .map(d => d.description);

        const parseDate = d3.timeParse("%Y%m");

        const x = d3.scaleBand()
            .domain(data.map(d => d.description))
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        svg.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.description))
            .attr("y", d => y(d.count))
            .attr("height", d => y(0) - y(d.count))
            .attr("width", x.bandwidth())
            .attr("fill",this.options.get("color"))
            .on('mouseover', function(d) {
                const value = formatNumberWithCommas(d.target.__data__.count);
                const key = d.target.__data__.description;
                bar_tooltip.transition().duration(200).style('opacity', .9);
                bar_tooltip.html(key+": "+value)
                    .style('left', (d.pageX) + 'px')
                    .style('top', (d.pageY - 28) + 'px');
            })
            .on('mouseout', function(d) {
                bar_tooltip.transition().duration(500).style('opacity', 0);
            });
           

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x)
                    .tickValues(xTickValues)
            );

        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));

        $container.update("");
     }      
});

var EPJS_Cached_Map = Class.create(EPJS_Stats, {

    initialize: function($super,params) {
        $super( params );
        this.view = 'Cached';
        this.draw();
    },

    ajax: function($super,response) {
        $super(response);
        const map_data = response.responseText.evalJSON();
        const $container = $( this.container_id );

        const map_svg = d3.select('#world_map_svg');
        const projection = d3.geoNaturalEarth1();
        const path = d3.geoPath().projection(projection);

        let zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [parseInt(map_svg.style('width')), parseInt(map_svg.style('height'))]])
            .on('zoom', handleZoom);

        function handleZoom(event) {
            const { transform } = event;
            map_svg.selectAll('path')
            .attr('transform', transform);
        }

        // Apply zoom behavior to the SVG element
        map_svg.call(zoom);
        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(map_data, d => d.count)])
            .range(["#ccc", this.options.get("color")]); // Example color range

        const tooltip = d3.select('#world_map_tooltip');

        // Load external data and boot
        d3.json("/javascript/world.geojson").then(function(data){

            const map_width = parseInt(map_svg.style('width'));
            const map_height = parseInt(map_svg.style('height'));

            projection.scale((map_width / 2) / Math.PI)
                .translate([map_width / 2, map_height / 2]);

            map_svg.selectAll('path')
                .data(data.features)
                .enter()
                .append('path')
                .attr("fill", d => {
                    const country = map_data.find(country => country.value === d.properties.iso_a2);
                    return country ? colorScale(country.count) : '#ccc'; // Default color if data is missing
                })
                .attr('d', path)
                .style("stroke", "#fff")
                .on('mouseover', function(d) {
                    const country = map_data.find(country => country.value === d.target.__data__.properties.iso_a2);
                    var tooltipText = d.target.__data__.properties.name;
                    if(country)
                    {
                        tooltipText = d.target.__data__.properties.name + ": " + formatNumberWithCommas(country.count);
                    }
            
                    tooltip.transition().duration(200)
                        .style('opacity', .9);
                    tooltip.html(tooltipText)
                        .style('left', (d.pageX) + 'px')
                        .style('top', (d.pageY - 28) + 'px');
                })
                .on('mouseout', function(d) {
                    tooltip.transition().duration(500)
                        .style('opacity', 0);
                });
        });

        $container.update("");

// Update map on window resize
window.addEventListener('resize', () => {
    const map_width = parseInt(map_svg.style('width'));
    const map_height = parseInt(map_svg.style('height'));

    projection.scale((map_width / 2) / Math.PI)
        .translate([map_width / 2, map_height / 2]);

    map_svg.selectAll('path')
        .attr('d', path);
});

    }    
});



// display number in a nice, human-readable way
function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

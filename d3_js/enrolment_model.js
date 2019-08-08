
    //model_margin 
    let model_margin = {
        top: 50,
        right: 70,
        bottom: 50,
        left: 60
    };

    //height and width
    let model_height = 400 - model_margin.top - model_margin.bottom;
    let model_width = 600 - model_margin.left - model_margin.right;

    let formatC = d3.format(",.0f");
    // let formatPercent = d3.format(".0%");

    //parseDate is used to covert string into year format from the csv file 
    let parseDate = d3.timeParse('%Y');

    //scales
    let model_xScale = d3.scalePoint().range([0, model_width]).padding(0.5);;


    //x1, used to create the group (grouped bars) elements
    // 0.1 is the padding added to offset the band from the edge of the interval
    let bar_xScale1 = d3.scaleBand()
        .rangeRound([0, model_width])
        .padding(.2)
        .paddingInner(.2);

    //x2, create the bar elements inside the group
    // domain and range will be set later
    let bar_xScale2 = d3.scaleBand()
        .padding(0.1);

    let model_yScale = d3.scaleLinear()
        .range([model_height, 0]);

    let bar_yScale = d3.scaleLinear()
        .range([model_height, 0]);

    //color scale
    let color_scale = d3.scaleOrdinal()
        .range(['#fde6ba', '#96c0e6', '#ef8a62', '#d8beda']);

    let bar_xAxis = d3.axisBottom()
        .scale(bar_xScale1);

    let model_yAxis = d3.axisRight()
        .scale(model_yScale);

    let bar_yAxis = d3.axisLeft()
        .scale(bar_yScale);


    //lines
    let growthLine = d3.line()
        .x(function (d) {
            return model_xScale(d.SCHOOL_YEAR);
        })
        .y(function (d) {
            return model_yScale(d.LAST_YEAR_ENROLMENT);
        }); //smooth the line


    //tirct controls
    let targetDistrict = 'SD99';
    let defaultPageLoad = true;

    //array used to populate dropdown menu
    let sd_arr = [];

    //range array
    let range_arr = [];

    //range slider domain
    let minYr, maxYr;
    //preset year range when start
    let yr1 = 2013;
    let yr2 = 2016;

    //canvas
    let model_svg = d3.select('#modelContainer').append('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")  // This forces uniform scaling for both the x and y, aligning the midpoint of the SVG object with the midpoint of the container element.
        .attr("viewBox", "0 0 600 400") //defines the aspect ratio, the inner scaling of object lengths and coordinates
        .attr('class', 'svg-content');

    let model_chartGroup = model_svg.append('g')
        .attr('class', 'chartGroup')
        .attr('transform', 'translate(' + model_margin.left + ',' + model_margin.top + ')');


    //tooltips
    let tooltip_line = d3.select("#modelContainer")
        .append("div")
        .attr("class", "modeltt_rect")
        .style('display', 'none');

    let tooltip_bar = d3.select("#modelContainer")
        .append("div")
        .attr("class", "modeltt_rect")
        .style('display', 'none');

    d3.csv('./assets/raw_data/key_drivers.csv', function (error, data) {
        if (error) {
            throw error;
        }

        let yAxis_driver_label = 'Driver Impact';
        let yAxis_total_label = 'Total Enrolment in Funded FTE';

        //get the array of keys (drivers)
        let driverNames = d3.keys(data[0]).filter(function (key) {
            if (key !== 'ABBREV' && key !== 'DISTRICT' && key !== 'SCHOOL_YEAR' && key !== 'LAST_YEAR_ENROLMENT') {
                return key;
            }
        });

        console.log(driverNames);

        //populate once
        if (sd_arr.length == 0) {
            //push unique values into dropdown array
            for (let i = 0; i < data.length; i++) {
                //get both school district numbers and names
                let sd_num = data[i].ABBREV;
                let sd_name = data[i].DISTRICT;
                let option = sd_num + '-' + sd_name;
                //covert school year string to num
                let year = +data[i].SCHOOL_YEAR;
                //check if it's already exist
                if ((sd_arr.indexOf(option) === -1) && option != 'SD99-Province') {
                    sd_arr.push(option);
                }

                //check if it's already exist
                if (range_arr.indexOf(year) === -1) {
                    range_arr.push(year);
                }
            }


            //starting year, min val of the array
            minYr = Math.min(...range_arr);
            //ending year
            maxYr = Math.max(...range_arr);

            //populate dropdown menu
            let dropDown = d3.select('#model_distDropdown .list');
            dropDown.append('div')
                .text('SD99-Province')
                .attr('data-value', 'SD99')
            for (let i = 0; i < sd_arr.length; i++) {
                let opt = sd_arr[i];
                dropDown
                    .append('div')
                    .text(opt)
                    //take the sd number (first 4 letters) as value
                    .attr('data-value', opt.substring(0, 4));
            };
        }

        function modelClear() {
            model_chartGroup.selectAll('.year').remove().transition()
                .duration(500);

            model_chartGroup.selectAll('.xAxis').remove().transition()
                .duration(500);

            model_chartGroup.selectAll('.yAxis').remove().transition()
                .duration(500);

            model_chartGroup.selectAll('.yAxis2').remove().transition()
                .duration(500);

            model_chartGroup.selectAll('.dot').remove().transition()
                .duration(500);

            model_chartGroup.selectAll('.line').remove().transition()
                .duration(500);

            model_chartGroup.select('#zero-line').remove().transition()
                .duration(500);
        }

        function updateGraph(yr1, yr2) {

            modelClear();

            let districtData = data.filter(function (d) {
                return (d.ABBREV == targetDistrict) && (+d.SCHOOL_YEAR >= yr1 && +d.SCHOOL_YEAR <= yr2)
            });

            //for each js object, generate a new key called drivers
            // value is an array of js objects each has driver name and value

            //because grouped bar chart
            //data must be grouped by year, inside data grouped by drivers 

            districtData.forEach(function (d) {
                d.LAST_YEAR_ENROLMENT = parseInt(d.LAST_YEAR_ENROLMENT);
                d.drivers = driverNames.map(function (name) {
                    return {
                        name: name,
                        value: +d[name]
                    };
                });
            });

            //set scale
            model_xScale.domain(districtData.map(function (d) { return d.SCHOOL_YEAR; }));
            bar_xScale1.domain(districtData.map(function (d) { return d.SCHOOL_YEAR; }));
            // set x2 sclae within the bar group
            bar_xScale2.domain(driverNames).rangeRound([0, bar_xScale1.bandwidth()]);
            model_yScale.domain([0, d3.max(districtData, function (d) { return d.LAST_YEAR_ENROLMENT; })]);

            // get min and max from multi columns (drivers)
            //first find out lowest/highest population amount throught the years then finds out largest number of drivers of that year
            bar_yScale.domain([d3.min(districtData, function (d) {
                return d3.min(d.drivers, function (d) {
                    return d.value;
                });
            }), d3.max(districtData, function (d) {
                return d3.max(d.drivers, function (d) {
                    return d.value;
                });
            })]);

            //line y axis
            model_chartGroup.append('g')
                .attr('class', 'yAxis')
                .attr('transform', "translate( " + model_width + ", 0 )")
                .call(model_yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr('class', 'axis_label')
                .attr('x', -model_height / 2)
                .attr("y", 65)
                .attr('text-anchor', 'middle')
                .text(yAxis_total_label);

            //bar y axis
            model_chartGroup.append('g')
                .attr('class', 'yAxis2')
                .call(bar_yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr('class', 'axis_label')
                .attr('x', -model_height / 2)
                .attr("y", -45)
                .attr('text-anchor', 'middle')
                .text(yAxis_driver_label);

            //bar x axis
            model_chartGroup.append('g')
                .attr('transform', 'translate(0,' + model_height + ')')
                .attr('class', 'xAxis')
                .call(bar_xAxis);

            //zero line

            let zero = [
                { 'x': 0, 'y': 0 },
                { 'x': model_width, 'y': 0 }
            ];

            var xScale = d3.scaleLinear()
                .domain([0, model_width]) // input
                .range([0, model_width]);

            let zero_line = d3.line()
                .x(function (d) { return xScale(d['x']); })
                .y(function (d) { return bar_yScale(d['y']); });

            model_chartGroup.append('path')
                .datum(zero)
                .attr('id', 'zero-line')
                .attr('d', zero_line);

            //year group
            let yrGroup = model_chartGroup.selectAll('.year')
                .data(districtData)
                .enter()
                .append('g')
                .attr('class', 'year')
                .attr('transform', function (d) {
                    return 'translate(' + bar_xScale1(d.SCHOOL_YEAR) + ',0)';
                });



            //draw grouped bars
            yrGroup.selectAll('.bar')
                .data(function (d) { return d.drivers; })
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('x', function (d) { return bar_xScale2(d.name); })
                .attr('width', function (d) { return bar_xScale2.bandwidth(); })
                .attr('y', function (d) { return bar_yScale(Math.max(0, d.value)); })
                .attr('height', function (d) { return Math.abs(bar_yScale(d.value) - bar_yScale(0)); })
                .style('fill', function (d) { return color_scale(d.name); })
                .on("mouseenter", function (d) {
                    //toolOver is the event handler
                    console.log(d);
                    return model_toolOver(d, this);
                })
                .on("mousemove", function (d) {
                    //gets mouse coordinates on screen
                    let offsetTarget = $(this).parent().parent().parent().parent();

                    let offset = offsetTarget.offset();

                    let mx = (event.pageX - offset.left);
                    let my = (event.pageY - offset.top);

                    return model_toolMove(mx, my, d);
                })
                .on("mouseleave", function (d) {
                    return model_toolOut(d, this);
                });

            //bar labels
            // let labels = model_chartGroup.selectAll(".label")
            //     .data(districtData)
            //     .enter()
            //     .append("text")
            //     .attr("class", "label")
            //     .attr("x", (function (d) { return bar_xScale(d.Year) + bar_xScale.bandwidth() / 2; }))
            //     .attr("y", function (d) { return model_height - bar_yScale(d.NetMigration) + 1; })
            //     .attr("dy", ".75em")
            //     .text(function (d) { return d.NetMigration; });

            //draw line graph
            let linegraph = model_chartGroup.append('path')
                .datum(districtData)
                .attr('class', 'line')
                .attr('d', growthLine);


            let dots = model_chartGroup.selectAll(".dot")
                .data(districtData)
                .enter().append("circle") // Uses the enter().append() method
                .attr("class", "dot") // Assign a class for styling
                .attr("cx", function (d) { return model_xScale(d.SCHOOL_YEAR); })
                .attr("cy", function (d) { return model_yScale(d.LAST_YEAR_ENROLMENT) })
                .attr("r", 5)
                .on("mouseenter", function (d) {
                    //toolOver is the event handler
                    console.log(d.ABBREV);
                    return model_toolOver(d, this);
                })
                .on("mousemove", function (d) {
                    //gets mouse coordinates on screen
                    let offsetTarget = $(this).parent().parent().parent().parent();

                    let offset = offsetTarget.offset();

                    let mx = (event.pageX - offset.left);
                    let my = (event.pageY - offset.top);

                    return model_toolMove(mx, my, d);
                })
                .on("mouseleave", function (d) {
                    return model_toolOut(d, this);
                });

            //dropdown select district
            //removes event handlers from selected elements as updateGraph
            $('#model_distDropdown').unbind().on('click', function (et) {
                $('.dropDown').not(this).removeClass('active');
                $(this).toggleClass('active');
                //or add on click when appending the divs
                d3.selectAll('#model_distDropdown .list div')
                    .on('click', function () {
                        $('#model_distDropdown span').text($(this).text());
                        $('#model_distDropdown').attr('attr', 'dropDown');

                        //reset target district 
                        targetDistrict = d3.select(this).attr('data-value');

                        let districtData = data.filter(function (d) { return d.ABBREV == targetDistrict && (+d.SCHOOL_YEAR >= yr1 && +d.SCHOOL_YEAR <= yr2) });
                        let distName = $(this).text();

                        //no need because event bubbling
                        //$(this).parent().toggleClass('active');

                        let driverNames = d3.keys(data[0]).filter(function (key) {
                            if (key !== 'ABBREV' && key !== 'DISTRICT' && key !== 'SCHOOL_YEAR' && key !== 'LAST_YEAR_ENROLMENT' && key !== 'drivers') {
                                return key
                            }
                        });

                        //for each js object, generate a new key called drivers
                        // value is an array of js objects each has driver name and value

                        //because grouped bar chart
                        //data must be grouped by year, inside data grouped by drivers 

                        districtData.forEach(function (d) {
                            d.LAST_YEAR_ENROLMENT = parseInt(d.LAST_YEAR_ENROLMENT);
                            d.drivers = driverNames.map(function (name) {
                                return {
                                    name: name,
                                    value: +d[name]
                                };
                            });
                        });

                        d3.select('#distName').text(distName);

                        if (distName == 'SD99-Province') {
                            d3.select('a.reportBtn').attr('href', 'https://www2.gov.bc.ca/gov/content/education-training/k-12/administration/program-management/reporting-on-k-12/district-reports');
                        } else {
                            //replace space with dash and covert to lower case '/ /g' is a regex (regular expression). The flag g means global. It causes all matches to be replaced.
                            let sdLink = distName.substring(5, distName.length).replace(/ - /g, ' ').replace(/ /g, '-').toLocaleLowerCase();
                            //set dynamic href for each sd
                            d3.select('a.reportBtn').attr('href', 'https://www2.gov.bc.ca/gov/content/education-training/k-12/administration/program-management/reporting-on-k-12/district-reports/' + sdLink);
                        }
                        //set aixs
                        model_xScale.domain(districtData.map(function (d) { return d.SCHOOL_YEAR; }));
                        bar_xScale1.domain(districtData.map(function (d) { return d.SCHOOL_YEAR; }));
                        // set x2 axis within the bar group
                        bar_xScale2.domain(driverNames).rangeRound([0, bar_xScale1.bandwidth()]);
                        model_yScale.domain([0, d3.max(districtData, function (d) { return d.LAST_YEAR_ENROLMENT; })]);

                        // get min and max from multi columns (drivers)
                        //first find out lowest/highest population amount throught the years then finds out largest number of drivers of that year
                        bar_yScale.domain([d3.min(districtData, function (d) {
                            return d3.min(d.drivers, function (d) {
                                return d.value;
                            });
                        }), d3.max(districtData, function (d) {
                            return d3.max(d.drivers, function (d) {
                                return d.value;
                            });
                        })]);

                        yrGroup.data(districtData);
                        yrGroup.selectAll('.bar')
                            .data(function (d) { return d.drivers; })
                            .transition()
                            .duration(1500)
                            .attr('y', function (d) { return bar_yScale(Math.max(0, d.value)); })
                            .attr('height', function (d) { return Math.abs(bar_yScale(d.value) - bar_yScale(0)); });

                        linegraph.datum(districtData)
                            .transition()
                            .duration(1500)
                            .attr('d', growthLine);


                        dots.data(districtData)
                            .transition()
                            .duration(1500)
                            .attr("cx", function (d) { return model_xScale(d.SCHOOL_YEAR); })
                            .attr("cy", function (d) { return model_yScale(d.LAST_YEAR_ENROLMENT) });

                        zero_line.y(function (d) { return bar_yScale(d['y']); });
                        d3.select('#zero-line')
                            .transition()
                            .duration(1600)
                            .attr('d', zero_line);

                        model_chartGroup.select('.yAxis')
                            .transition()
                            .duration(1600)
                            .call(model_yAxis);

                        model_chartGroup.select('.yAxis2')
                            .transition()
                            .duration(1600)
                            .call(bar_yAxis);
                    });
            });

            //legends
            let legends = ['Demographics', 'Migration', 'Retention', 'Transition']
            let svgContainer = d3.select('#modelContainer .svg-content');
            let legend = svgContainer.selectAll(".legend")
                .data(legends)
                .enter().append("svg")
                .append('g')
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(" + i * 100 + ", 0)"; })
                .style("opacity", "0");

            legend.append("rect")
                .attr("x", model_width - 300)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", function (d) { return color_scale(d); });

            legend.append("text")
                .attr("x", model_width - 280)
                .attr("y", 9)
                .attr("dy", ".3em")
                .style("text-anchor", "start")
                .text(function (d) { return d; });

            // legend.transition().duration(500).delay(function (d, i) { return 1300 + 100 * i; }).style("opacity", "1");
            legend.style("opacity", "1");

        }

        let model_slider_width = $('#model_control').width();
        //render graph set up slider
        updateGraph(yr1, yr2);
        setupSlider(yr1, yr2);
        $(window).resize(function () {
            d3.select('#model_slider svg').remove();
            model_slider_width = $('#model_control').width();
            setupSlider(yr1, yr2);
        });


        //range slider(brush)
        function setupSlider(v1, v2) {
            let sliderVals = [v1, v2];

            let svg = d3.select('#model_slider').append('svg')
                .attr('width', model_slider_width)
                .attr('height', 50);

            let xScale = d3.scaleLinear()
                .domain([minYr, maxYr])
                .range([0, model_slider_width - 30])
                .clamp(true);

            let xMin = xScale(minYr),
                xMax = xScale(maxYr);

            let rangeSlider = svg.append('g')
                .attr('class', 'slider')
                .attr('transform', 'translate(5,20)');

            rangeSlider.append('line')
                .attr('class', 'track')
                .attr('x1', 10 + xScale.range()[0])
                .attr('x2', 10 + xScale.range()[1]);

            console.log(sliderVals[1]);
            let selectRange = rangeSlider.append('line')
                .attr('class', 'sel-range')
                .attr('x1', xScale(sliderVals[0]))
                .attr('x2', xScale(sliderVals[1]));

            rangeSlider.insert('g', '.track-overlay')
                .attr('class', 'ticks')
                .attr('transform', 'translate(8,24)')
                .selectAll('text')
                .data(xScale.ticks(6))
                .enter().append('text')
                .attr('x', xScale)
                .attr('text-anchor', 'middle')
                .text(function (d) { return d; })

            let handle = rangeSlider.selectAll('rect')
                .data([0, 1])
                .enter()
                .append('rect', '.track-overlay')
                .attr('class', 'handle')
                .attr('y', -10)
                .attr('x', function (d) { return xScale(sliderVals[d]); })
                .attr('rx', 3)
                .attr('height', 20)
                .attr('width', 16)
                .call(
                    d3.drag()
                        .on('start', startDrag)
                        .on('drag', drag)
                        .on('end', endDrag)
                );

            function startDrag(d) {
                d3.select(this).raise().classed('active', true);
            }

            function drag(d) {
                let x1 = d3.event.x;
                if (x1 > xMax) {
                    x1 = xMax
                } else if (x1 < xMin) {
                    x1 = xMin
                }
                d3.select(this).attr('x', x1);

                let x2 = xScale(sliderVals[d == 0 ? 1 : 0]);
                selectRange.attr('x1', 10 + x1)
                    .attr('x2', 10 + x2);

            }

            function endDrag(d) {
                let endVal = Math.round(xScale.invert(d3.event.x))
                let elem = d3.select(this)
                sliderVals[d] = endVal;
                let v1 = Math.min(sliderVals[0], sliderVals[1]);
                let v2 = Math.max(sliderVals[0], sliderVals[1]);

                elem.classed('active', false)
                    .attr('x', xScale(endVal));

                selectRange.attr('x1', 10 + xScale(v1))
                    .attr('x2', 10 + xScale(v2));

                $('#model_distDropdown').removeClass('.active');

                updateGraph(v1, v2);
            }
        }
    });



    function model_toolOver(d, target) {
        if (d.ABBREV) {
            d3.select(target)
                //in v4+ use the "long forms"
                .attr("style", "fill:#FCBA19")
                .attr("cursor", "pointer");
            return tooltip_line.style('display', null);
        } else {
            return tooltip_bar.style('display', null);
        }
    }

    function model_toolOut(d, target) {
        if (d.ABBREV) {
            d3.select(target)
                .attr("style", "fill:#002663")
                .attr("cursor", "pointer");
            return tooltip_line.style('display', 'none');
        } else {
            return tooltip_bar.style('display', 'none');
        }
    }


    function model_toolMove(mx, my, data) {
        //inject info
        if (data.ABBREV) {
            return tooltip_line.style("top", my + "px")
                .style("left", mx - 10 + "px")
                .html(function () {
                    let content = "<div class='tipHeader'><b>Year: </b>" + data.SCHOOL_YEAR + "</div>";
                    content += "<div class='tipInfo'>Total Enrolment: <span class='tipNum'>" + Math.round(data.LAST_YEAR_ENROLMENT).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>"
                    return content;
                });
        } else {
            return tooltip_bar.style("top", my + "px")
                .style("left", mx + 10 + "px")
                .html(function () {
                    let content = "<div class='tipHeader'>" + data.name + "</div>";
                    content += "<div class='tipInfo'>Impact: <span class='tipNum'>" + Math.round(data.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>"
                    return content;
                });
        }
    }


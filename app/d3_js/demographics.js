$(document).ready(function () {
    //margin
    let demo_margin = {
        top: 10,
        right: 20,
        bottom: 50,
        left: 80
    };
    //height and width
    let demo_height = 400 - demo_margin.top - demo_margin.bottom;
    let demo_width = 600 - demo_margin.left - demo_margin.right;

    //scales
    let demo_xScale = d3.scalePoint().range([0, demo_width]).padding(0.5);
    let demo_yScale = d3.scaleLinear().range([demo_height, 0]);

    //create color scale
    let color_arr = ['#6699CC', '#99C794', '#5FB3B3', '#EC5F67', '#F99157', '#FAC863', '#C594C5', '#AB7967'];
    let demo_color = d3.scaleOrdinal(color_arr);

    //axes
    let demo_xAxis = d3.axisBottom()
        .scale(demo_xScale);

    let demo_yAxis = d3.axisLeft()
        .scale(demo_yScale)
        .tickSizeOuter(0)
        .tickSize(-demo_width)
        .tickPadding(20);

    //canvas
    let demo_svg = d3.select('#demo_container')
        .append('svg')
        .attr("preserveAspectRatio", "xMinYMin meet") // This forces uniform scaling for both the x and y, aligning the midpoint of the SVG object with the midpoint of the container element.
        .attr("viewBox", "0 0 600 400") //define the aspect ratio, the inner scaling of object lengths and coordinates
        .attr('class', 'svg-content');

    let demo_chartGroup = demo_svg.append('g')
        .attr('class', 'chartGroup')
        .attr("transform", "translate(" + demo_margin.left + "," + demo_margin.top + ")");

    let legendContainer = d3.select('#demo_legend')
        .append('svg')
        .attr('height', '160px')
        .append('g')
        .attr('class', 'legendContainer');

    d3.csv('./assets/raw_data/demographics.csv', function (error, data) {
        if (error) {
            throw error;
        }

        //array of selected district (objects), used to draw lines
        let defaultDistrict = ['SD99-Province'];

        let defaultType = 'NEW_KINDERGARTEN';

        let yAxis_label = 'Number of Students';

        function demoClear() {
            //clear existing line
            let existingPath = d3.selectAll("#demo_container .demo_line");
            existingPath.exit();
            existingPath.transition()
                .duration(500)
                .remove();
            //clear existing legends
            let existingLegend = d3.selectAll("#demo_legend .legend");

            existingLegend.exit();
            existingLegend.transition()
                .duration(100)
                .remove();

            //clear tooltips 
            demo_chartGroup.selectAll(".demott_circle")
                .remove();
            d3.selectAll(".demott_rect")
                .remove();
        }

        function demoUpdate(type, selectedDistricts) {


            //array of all selected, used to set axes
            let districtData = [];
            for (let dist of selectedDistricts) {

                let district = data.filter(function (d) {
                    return d.DISTRICT == dist.substring(2, 4)
                });

                // format the data
                district.forEach(function (d) {
                    d.SCHOOL_YEAR = (parseDate(d.SCHOOL_YEAR)).getFullYear();
                    d.NEW_KINDERGARTEN = +d.NEW_KINDERGARTEN;
                    d.GRADUATES = Math.abs(+d.GRADUATES);
                    d.NET = +d.NET;
                });
                // concat method doesn't change the original array, need to reassign it.
                districtData = districtData.concat(district);
            }

            console.log(districtData);
            //tooltips
            let demott = demo_chartGroup.append('g')
                .attr('class', 'demott')
                .style('display', 'none');

            //tt line
            demott.append('line')
                .attr('class', 'demott_line')
                .attr("y1", 0)
                .attr("y2", demo_height);

            //tt info rect, since z-index doesnt work for svg elments, draw later
            d3.select('#demo_container').append('div')
                .attr('class', 'demott_rect')
                .style('display', 'none');

            //overlay, to triger tt
            demo_svg.append('rect')
                .attr("transform", "translate(" + demo_margin.left + "," + demo_margin.top + ")")
                .attr("class", "demo_overlay")
                .attr("width", demo_width)
                .attr("height", demo_height)
                .on("mouseover", function () {
                    demott.style("display", null);
                })
                .on("mouseleave", function () {

                    demott.style("display", "none");
                    d3.selectAll(".demott_rect")
                        .style('display', 'none');
                    demo_chartGroup.selectAll(".demott_circle")
                        .style('display', 'none');

                })
                .on("mousemove", showDemott);

            let currentPos;

            function showDemott() {

                // custom invert function for point scale + tooltips
                let xPos = d3.mouse(this)[0];
                let domain = demo_xScale.domain();
                let range = demo_xScale.range();
                let rangePoints = d3.range(range[0], range[1], demo_xScale.step())
                currentPos = domain[d3.bisect(rangePoints, xPos) - 1];

                if (currentPos) {
                    demott.select(".demott_line").attr("x1", demo_xScale(currentPos));
                    demott.select(".demott_line").attr("x2", demo_xScale(currentPos));
                    demo_chartGroup.selectAll(".demott_circle")
                        .style('display', 'none');
                    // select circles for the current year (mouse over)
                    demo_chartGroup.selectAll("circle[cx='" + demo_xScale(currentPos) + "']")
                        .style('display', null);

                    //difference btween contianer div and svg canvas
                    let oBox = document.getElementById('demo_container').getBoundingClientRect();
                    let svgSacle = oBox.width / 600;

                    d3.select(".demott_rect")
                        .style('display', null)
                        .html(function () {
                            let content = "<div class='tipHeader'><b>Year: </b>" + currentPos + "</div>";
                            for (let d of selectedDistricts) {
                                for (let d2 of districtData) {
                                    if (d2.DISTRICT == d.substring(2, 4) && d2.SCHOOL_YEAR == currentPos)
                                        content += "<div class='tipInfo' data-num='" + d2[type] + "'>" + d.substring(5, d.length) + ": <span class='tipNum'>" + d2[type].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>"
                                }
                            }
                            return content;
                        });

                    //sort html elements based on value
                    let tipBox = $('.demott_rect');

                    tipBox.find('.tipInfo').sort(function (a, b) {
                        return +b.getAttribute('data-num') - +a.getAttribute('data-num')
                    })
                        .appendTo(tipBox);


                    if (currentPos == 2018) {
                        d3.select(".demott_rect").style('left', (demo_xScale(currentPos) * svgSacle - 40 * svgSacle) + 'px');
                    } else {
                        d3.select(".demott_rect").style('left', (demo_xScale(currentPos) * svgSacle + 100 * svgSacle) + 'px');;
                    }
                }
            }



            // use for loop for positioning the legend
            for (let i = 0; i < selectedDistricts.length; i++) {
                let district = data.filter(function (d) {
                    return d.DISTRICT == selectedDistricts[i].substring(2, 4)
                });

                //set scale domain (combined districtData[])
                demo_xScale.domain(districtData.map(function (d) {
                    return d.SCHOOL_YEAR;
                }));

                if ((selectedDistricts[i] == 'SD99-Province')) {
                    let radioValue = $("input[name='demo-type']:checked").val();

                    if (radioValue != 'NET') {
                        demo_yScale.domain([Math.min(35000, d3.min(districtData, function (d) {
                            return d[type];
                        })),
                        Math.max(-35000, d3.max(districtData, function (d) {
                            return d[type];
                        }))
                        ]);
                    } else {
                        demo_yScale.domain([Math.min(0, d3.min(districtData, function (d) {
                            return d[type];
                        })),
                        Math.max(0, d3.max(districtData, function (d) {
                            return d[type];
                        }))
                        ]);
                    }
                } else {

                    demo_yScale.domain([Math.min(0, d3.min(districtData, function (d) {
                        return d[type];
                    })),
                    Math.max(0, d3.max(districtData, function (d) {
                        return d[type];
                    }))
                    ]);
                }
                //line generator 
                let demoLine = d3.line()
                    .x(function (d) {
                        return demo_xScale(d.SCHOOL_YEAR);
                    })
                    .y(function (d) {
                        return demo_yScale(d[type]);
                    })
                    .curve(d3.curveCardinal.tension(0.85)); //smooth the line, round corner;


                //draw line
                let demo_line = demo_chartGroup.append('path')
                    .datum(district)
                    .attr('class', 'demo_line')
                    .attr('d', demoLine)
                    .attr('fill', 'none')
                    .attr("stroke-width", "2")
                    .attr('stroke', demo_color(selectedDistricts[i]));

                // draw legend
                let legend = legendContainer.append('g')
                    .attr('class', 'legend');

                legend.append("rect")
                    .attr("x", 10)
                    .attr("y", i * 20)
                    .attr("width", 18)
                    .attr("height", 18)
                    .style("fill", demo_color(selectedDistricts[i]));

                legend.append("text")
                    .attr("x", 30)
                    .attr("y", 15 + i * 20)
                    .text(selectedDistricts[i]);

                //tooltips info
                d3.select('.demott')
                    .append('div')
                    .text(selectedDistricts[i]);

                //animate path
                let totalLength = demo_line.node().getTotalLength();
                // console.log(totalLength);

                demo_line.attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(1500)
                    .attr("stroke-dashoffset", 0);

                //tooltips circle
                for (let dist of district) {
                    demo_chartGroup.append('circle')
                        .attr('class', 'demott_circle')
                        .attr('r', '5')
                        .attr('cx', demo_xScale(dist.SCHOOL_YEAR))
                        .attr('cy', demo_yScale(dist[type]))
                        .style('fill', demo_color(selectedDistricts[i]))
                        .style('display', 'none');
                }
            }


            if ($('#demo_container .yAxis').length) {

                //set transition
                let tran = d3.transition()
                    .duration(1500);

                d3.select("#demo_container .yAxis")
                    .transition(tran)
                    .call(demo_yAxis);

                d3.select("#demo_container .xAxis")
                    .transition(tran)
                    .call(demo_xAxis);

            } else {

                //axes
                demo_chartGroup.append('g')
                    .attr('class', 'yAxis')
                    .call(demo_yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr('class', 'axis_label')
                    .attr('x', -demo_height / 2)
                    .attr("y", -60)
                    .attr('text-anchor', 'middle')
                    .text(yAxis_label);

                demo_chartGroup.append('g')
                    .attr('class', 'xAxis')
                    .attr('transform', 'translate(0,' + demo_height + ')')
                    .call(demo_xAxis);

                //grid line
                d3.selectAll("g.yAxis g.tick")
                    .append("line")
                    .attr("class", "gridline")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", demo_width)
                    .attr("y2", 0);
            }
        }

        demoUpdate(defaultType, defaultDistrict);

        /******control******/

        //radio selection
        $("input[type='radio']").change(function () {
            let radioValue = $("input[name='demo-type']:checked").val();
            if (radioValue) {
                demoClear();
                demoUpdate(radioValue, defaultDistrict);
            }
        });

        //checkbox list in modal, sd_arr (list of districts) is a global array from predictors section
        //value= '" + dist + "' has to be quoted like this, since val contains space
        $.each(sd_arr, function (index, dist) {
            let checkbox = "<div class='checkbox'><label><input type='checkbox' id=" + dist.substring(2, 4) + " class='demo_checkbox' value= '" + dist + "'><span>" + dist.substring(2, dist.length) + "</span></label></div>"
            $(".modal-body").append($(checkbox));
        })

        $(".modal-body").append("<div class='checkbox'><label><input type='checkbox' id='99' class='demo_checkbox' value= 'SD99-Province' checked><span>99-Province</span></label></div>");

        //set the selection limit
        $('.checkbox input:checkbox').on('change', function (e) {
            $('#demoModal_msg').css('color', '#494949');
            if ($('.checkbox input:checkbox:checked').length > 8) {
                //this.checked = false; OR 
                $(this).prop('checked', false);
                $('#demoModal_msg').css('color', '#d8292f');
            }
        });

        $('#demo_deselect').click(function () {
            $('.demo_checkbox').prop("checked", false);
        });

        $('#demo_save').click(function () {
            defaultDistrict = [];
            $(".checkbox  input:checkbox:checked").map(function (e) {
                defaultDistrict.push($(this).val());
            });
            let radioValue = $("input[name='demo-type']:checked").val()
            console.log(radioValue);
            demoClear();
            demoUpdate(radioValue, defaultDistrict);
        });
    });
});
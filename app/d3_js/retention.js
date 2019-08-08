$(document).ready(function () {
    //margin
    let retention_margin = {
        top: 20,
        right: 65,
        bottom: 50,
        left: 60
    };

    //height and width
    let retention_height = 400 - retention_margin.top - retention_margin.bottom;
    let retention_width = 600 - retention_margin.left - retention_margin.right;

    //scales
    let retention_xScale = d3.scalePoint().range([0, retention_width]).padding(0.5);
    let retention_yScale_dist = d3.scaleLinear().range([retention_height, 0]);
    let retention_yScale_prov = d3.scaleLinear().range([retention_height, 0]);

    //axes
    let retention_xAxis = d3.axisBottom()
        .scale(retention_xScale);

    let retention_yAxis_dist = d3.axisLeft()
        .scale(retention_yScale_dist)
        .tickSizeOuter(0)
        .tickSize(-retention_width + 40)
        .tickPadding(20);

    let retention_yAxis_prov = d3.axisRight()
        .scale(retention_yScale_prov)
        .tickSizeOuter(0);

    //lines
    let prov_line = d3.line()
        .x(function (d) {
            return retention_xScale(d.SCHOOL_YEAR);
        })
        .y(function (d) {
            return retention_yScale_prov(d.PROV_NET_RETENTION);
        })
        .curve(d3.curveCardinal.tension(0.5)); //smooth the line, round corner
    // .interpolate("monotone");

    //lines
    let dist_line = d3.line()
        .x(function (d) {
            return retention_xScale(d.SCHOOL_YEAR);
        })
        .y(function (d) {
            return retention_yScale_dist(d.DIST_NET_RETENTION);
        })
        .curve(d3.curveCardinal.tension(0.5)); //smooth the line

    //canvas
    let retention_svg = d3.select('#retention_container')
        .append('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet') // This forces uniform scaling for both the x and y, aligning the midpoint of the SVG object with the midpoint of the container element.
        .attr('viewBox', '0 0 600 400') //define the aspect ratio, the inner scaling of object lengths and coordinates
        .attr('class', 'svg-content');

    let retention_chartGroup = retention_svg.append('g')
        .attr('class', 'chartGroup')
        .attr('transform', 'translate(' + retention_margin.left + ',' + retention_margin.top + ')');

    let r_legendContainer = d3.select('#retention_control .row')
        .append('svg')
        .attr('class', 'retention_legend col-5');

    //populate dropdown menu
    for (let i = 0; i < sd_arr.length; i++) {
        let opt = sd_arr[i];
        d3.select('#retention_distDropdown .list')
            .append('div')
            .text(opt)
            //take the sd number (first 4 letters) as value
            .attr('data-value', opt.substring(0, 4));
    };

    function retentionClear() {
        //clear existing line
        let provLine = d3.selectAll('#retention_container .prov_retention_line');
        provLine.exit();
        provLine.transition()
            .duration(500)
            .remove();

        let distLine = d3.selectAll('#retention_container .dist_retention_line');
        distLine.exit();
        distLine.transition()
            .duration(500)
            .remove();

        //clear existing legends
        let existingLegend = d3.selectAll('.retention_legend .legend');
        existingLegend.exit();
        existingLegend.transition()
            .duration(100)
            .remove();

        //clear tooltips 
        retention_chartGroup.selectAll('.retentiontt_circle')
            .remove();
        d3.selectAll('.retentiontt_rect')
            .remove();
    }

    d3.csv('../assets/raw_data/retention_province.csv', function (error, data) {
        if (error) {
            throw error;
        }

        let targetSd = 'Southeast Kootenay';

        let provData = data;
        provData.forEach(function (d) {
            d.SCHOOL_YEAR = (parseDate(d.SCHOOL_YEAR)).getFullYear()
            d.PROV_NET_RETENTION = +d.PROV_NET_RETENTION;
        })


        function retentionUpdate(dist) {

            d3.csv('../assets/raw_data/retention_district.csv', function (error, data) {
                if (error) {
                    throw error;
                }

                let yAxis_dist_label = 'Change in Full Course Load - District';
                let yAxis_prov_label = 'Change in Full Course Load - Province';

                let districtData = data.filter(function (d) {
                    return +d.DISTRICT == dist;
                });

                districtData.forEach(function (d) {
                    d.SCHOOL_YEAR = (parseDate(d.SCHOOL_YEAR)).getFullYear();
                    d.DIST_NET_RETENTION = +d.DIST_NET_RETENTION;
                });

                //set scale domain
                retention_xScale.domain(districtData.map(function (d) {
                    return d.SCHOOL_YEAR;
                }));

                retention_yScale_prov.domain([d3.min(provData, function (d) {
                    return d.PROV_NET_RETENTION;
                }), 0]);

                retention_yScale_dist.domain([d3.min(districtData, function (d) {
                    return d.DIST_NET_RETENTION;
                }), d3.max(districtData, function (d) {
                    return d.DIST_NET_RETENTION;
                })]);

                //tooltips
                let retentiontt = retention_chartGroup.append('g')
                    .attr('class', 'retentiontt')
                    .style('display', 'none');

                //tt line
                retentiontt.append('line')
                    .attr('class', 'retentiontt_line')
                    .attr("y1", 0)
                    .attr("y2", retention_height);

                //tt info rect, since z-index doesnt work for svg elments, draw later
                d3.select('#retention_container').append('div')
                    .attr('class', 'retentiontt_rect')
                    .style('display', 'none');

                //overlay, to triger tt
                retention_svg.append('rect')
                    .attr("transform", "translate(" + retention_margin.left + "," + retention_margin.top + ")")
                    .attr("class", "retention_overlay")
                    .attr("width", retention_width)
                    .attr("height", retention_height)
                    .on("mouseover", function () {
                        retentiontt.style("display", null);
                    })
                    .on("mouseleave", function () {

                        retentiontt.style("display", "none");
                        d3.selectAll(".retentiontt_rect")
                            .style('display', 'none');
                        retention_chartGroup.selectAll(".retentiontt_circle")
                            .style('display', 'none');

                    })
                    .on("mousemove", showRetentiontt);

                let currentPos;
                // custom invert function for point scale + tooltips
                function showRetentiontt() {
                    let xPos = d3.mouse(this)[0];
                    let domain = retention_xScale.domain();
                    let range = retention_xScale.range();
                    let rangePoints = d3.range(range[0], range[1], retention_xScale.step())
                    currentPos = domain[d3.bisect(rangePoints, xPos) - 1];

                    console.log(currentPos);

                    if (currentPos) {
                        retentiontt.select(".retentiontt_line").attr("x1", retention_xScale(currentPos));
                        retentiontt.select(".retentiontt_line").attr("x2", retention_xScale(currentPos));
                        retention_chartGroup.selectAll(".retentiontt_circle")
                            .style('display', 'none');
                        // select circles for the current year (mouse over)
                        retention_chartGroup.selectAll("circle[cx='" + retention_xScale(currentPos) + "']")
                            .style('display', null);

                        //difference btween contianer div and svg canvas
                        let oBox = document.getElementById('retention_container').getBoundingClientRect();
                        let svgSacle = oBox.width / 600;

                        d3.select(".retentiontt_rect")
                            .style('display', null)
                            .html(function () {
                                let content = "<div class='tipHeader'><b>Year: </b>" + currentPos + "</div>";
                                for (let d of provData) {
                                    if (d.SCHOOL_YEAR == currentPos)
                                        content += "<div class='tipInfo' data-num='" + d.PROV_NET_RETENTION + "'>Province: <span class='tipNum'>" + d.PROV_NET_RETENTION + "</span></div>";
                                }
                                for (let d2 of districtData) {
                                    if ((d2.SCHOOL_YEAR == currentPos) && (d2.DISTRICT = dist))
                                        content += "<div class='tipInfo' data-num='" + d2.DIST_NET_RETENTION + "'>" + targetSd + ": <span class='tipNum'>" + d2.DIST_NET_RETENTION + "</span></div>";
                                }

                                return content;
                            });

                        //sort html elements based on value
                        let tipBox = $('.retentiontt_rect');

                        tipBox.find('.tipInfo').sort(function (a, b) {
                            return +b.getAttribute('data-num') - +a.getAttribute('data-num')
                        })
                            .appendTo(tipBox);


                        if (currentPos == 2018) {
                            d3.select(".retentiontt_rect").style('left', (retention_xScale(currentPos) * svgSacle - 60 * svgSacle) + 'px');
                        } else {
                            d3.select(".retentiontt_rect").style('left', (retention_xScale(currentPos) * svgSacle + 70 * svgSacle) + 'px');;
                        }
                    }
                }

                //draw liens
                let prov_retention_line = retention_chartGroup.append('path')
                    .datum(provData)
                    .attr('class', 'prov_retention_line')
                    .attr('d', prov_line)
                    .attr('fill', 'none')
                    .attr('stroke-width', '2');

                let dist_retention_line = retention_chartGroup.append('path')
                    .datum(districtData)
                    .attr('class', 'dist_retention_line')
                    .attr('d', dist_line)
                    .attr('fill', 'none')
                    .attr('stroke-width', '2');

                //animate path
                let plineLength = prov_retention_line.node().getTotalLength();
                let dlineLength = dist_retention_line.node().getTotalLength();

                prov_retention_line.attr("stroke-dasharray", plineLength + " " + plineLength)
                    .attr("stroke-dashoffset", plineLength)
                    .transition()
                    .duration(1500)
                    .attr("stroke-dashoffset", 0);

                dist_retention_line.attr("stroke-dasharray", dlineLength + " " + dlineLength)
                    .attr("stroke-dashoffset", dlineLength)
                    .transition()
                    .duration(1500)
                    .attr("stroke-dashoffset", 0);

                //legends
                let retention_legend = r_legendContainer.append('g')
                    .attr('class', 'legend');

                retention_legend.append('rect')
                    .attr('x', 10)
                    .attr('y', 20)
                    .attr('width', 18)
                    .attr('height', 18)
                    .style('fill', '#002663');

                retention_legend.append('text')
                    .attr('x', 30)
                    .attr('y', 35)
                    .text('Province');

                retention_legend.append('rect')
                    .attr('x', 10)
                    .attr('y', 50)
                    .attr('width', 18)
                    .attr('height', 18)
                    .style('fill', '#FCBA19');

                retention_legend.append('text')
                    .attr('x', 30)
                    .attr('y', 65)
                    .text(targetSd);

                //tooltips circle
                for (let dist of districtData) {
                    retention_chartGroup.append('circle')
                        .attr('class', 'retentiontt_circle')
                        .attr('r', '5')
                        .attr('cx', retention_xScale(dist.SCHOOL_YEAR))
                        .attr('cy', retention_yScale_dist(dist.DIST_NET_RETENTION))
                        .style('fill', '#FCBA19')
                        .style('display', 'none');
                }

                //tooltips circle
                for (let prov of provData) {
                    retention_chartGroup.append('circle')
                        .attr('class', 'retentiontt_circle')
                        .attr('r', '5')
                        .attr('cx', retention_xScale(prov.SCHOOL_YEAR))
                        .attr('cy', retention_yScale_prov(prov.PROV_NET_RETENTION))
                        .style('fill', '#002663')
                        .style('display', 'none');
                }



                if ($('#retention_container .yAxis_dist').length) {

                    //set transition
                    let tran = d3.transition()
                        .duration(1500);

                    d3.select('#retention_container .yAxis_dist')
                        .transition(tran)
                        .call(retention_yAxis_dist);

                    d3.select('#retention_container .yAxis_prov')
                        .transition(tran)
                        .call(retention_yAxis_prov);

                    d3.select('#retention_container .xAxis')
                        .transition(tran)
                        .call(retention_xAxis);

                } else {

                    //axes
                    retention_chartGroup.append('g')
                        .attr('class', 'yAxis_dist')
                        .call(retention_yAxis_dist)
                        .append('text')
                        .attr('transform', 'rotate(-90)')
                        .attr('class', 'axis_label')
                        .attr('x', -retention_height / 2)
                        .attr("y", -45)
                        .attr('text-anchor', 'middle')
                        .text(yAxis_dist_label);

                    retention_chartGroup.append('g')
                        .attr('class', 'yAxis_prov')
                        .attr('transform', 'translate( ' + retention_width + ', 0 )')
                        .call(retention_yAxis_prov)
                        .append('text')
                        .attr('transform', 'rotate(-90)')
                        .attr('class', 'axis_label')
                        .attr('x', -retention_height / 2)
                        .attr("y", 60)
                        .attr('text-anchor', 'middle')
                        .text(yAxis_prov_label);

                    retention_chartGroup.append('g')
                        .attr('class', 'xAxis')
                        .attr('transform', 'translate(0,' + retention_height + ')')
                        .call(retention_xAxis);

                }


            });


        }

        //default district
        retentionUpdate('05');

        //dropdown select district
        //removes event handlers from selected elements as updateGraph
        $('#retention_distDropdown').unbind().on('click', function () {
            $('.dropDown').not(this).removeClass('active');
            $(this).toggleClass('active');
            //or add on click when appending the divs
            d3.selectAll('#retention_distDropdown .list div')
                .on('click', function () {
                    $('#retention_distDropdown span').text($(this).text());
                    $('#retention_distDropdown').attr('attr', 'dropDown');

                    //reset target district 
                    targetSd = $(this).text();
                    targetSd = targetSd.substring(5, targetSd.length);
                    targetDistrict = d3.select(this).attr('data-value').substring(2, 4);
                    retentionClear();
                    retentionUpdate(targetDistrict);
                });
        });

    });
});
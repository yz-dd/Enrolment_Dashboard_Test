
$(document).ready(function () {
  //margin
  var retention_margin = {
    top: 20,
    right: 65,
    bottom: 50,
    left: 60
  }; //height and width

  //school district array, declared separately due to Grunt bundling issue with 
  //Studentsucess site (global array from enrollment.js is not accessible)
  var sd_arr = ["SD05-Southeast Kootenay"
  ,"SD06-Rocky Mountain"
  ,"SD08-Kootenay Lake"
  ,"SD10-Arrow Lakes"
  ,"SD19-Revelstoke"
  ,"SD20-Kootenay - Columbia"
  ,"SD22-Vernon"
  ,"SD23-Central Okanagan"
  ,"SD27-Cariboo - Chilcotin"
  ,"SD28-Quesnel"
  ,"SD33-Chilliwack"
  ,"SD34-Abbotsford"
  ,"SD35-Langley"
  ,"SD36-Surrey"
  ,"SD37-Delta"
  ,"SD38-Richmond"
  ,"SD39-Vancouver"
  ,"SD40-New Westminster"
  ,"SD41-Burnaby"
  ,"SD42-Maple Ridge - Pitt Meadows"
  ,"SD43-Coquitlam"
  ,"SD44-North Vancouver"
  ,"SD45-West Vancouver"
  ,"SD46-Sunshine Coast"
  ,"SD47-Powell River"
  ,"SD48-Sea to Sky"
  ,"SD49-Central Coast"
  ,"SD50-Haida Gwaii - Queen Charlotte"
  ,"SD51-Boundary"
  ,"SD52-Prince Rupert"
  ,"SD53-Okanagan Similkameen"
  ,"SD54-Bulkley Valley"
  ,"SD57-Prince George"
  ,"SD58-Nicola - Similkameen"
  ,"SD59-Peace River South"
  ,"SD60-Peace River North"
  ,"SD61-Greater Victoria"
  ,"SD62-Sooke"
  ,"SD63-Saanich"
  ,"SD64-Gulf Islands"
  ,"SD67-Okanagan Skaha"
  ,"SD68-Nanaimo - Ladysmith"
  ,"SD69-Qualicum"
  ,"SD70-Alberni"
  ,"SD71-Comox Valley"
  ,"SD72-Campbell River"
  ,"SD73-Kamloops - Thompson"
  ,"SD74-Gold Trail"
  ,"SD75-Mission Public"
  ,"SD78-Fraser - Cascade"
  ,"SD79-Cowichan Valley"
  ,"SD81-Fort Nelson"
  ,"SD82-Coast Mountains"
  ,"SD83-Okanagan - Shuswap"
  ,"SD84-Vancouver Island West"
  ,"SD85-Vancouver Island North"
  ,"SD87-Stikine"
  ,"SD91-Nechako Lakes"
  ,"SD92-Nisga"
  ,"SD93-Conseil scolaire francophone"];

  var retention_height = 400 - retention_margin.top - retention_margin.bottom;
  var retention_width = 600 - retention_margin.left - retention_margin.right; //scales

  var retention_xScale = d3.scalePoint().range([0, retention_width]).padding(0.5);
  var retention_yScale_dist = d3.scaleLinear().range([retention_height, 0]);
  var retention_yScale_prov = d3.scaleLinear().range([retention_height, 0]); //axes

  var retention_xAxis = d3.axisBottom().scale(retention_xScale);
  var retention_yAxis_dist = d3.axisLeft().scale(retention_yScale_dist).tickSizeOuter(0).tickSize(-retention_width + 40).tickPadding(20);
  var retention_yAxis_prov = d3.axisRight().scale(retention_yScale_prov).tickSizeOuter(0); //lines

  var prov_line = d3.line().x(function (d) {
    return retention_xScale(d.SCHOOL_YEAR);
  }).y(function (d) {
    return retention_yScale_prov(d.PROV_NET_RETENTION);
  }).curve(d3.curveCardinal.tension(0.5)); //smooth the line, round corner
  // .interpolate("monotone");
  //lines

  var dist_line = d3.line().x(function (d) {
    return retention_xScale(d.SCHOOL_YEAR);
  }).y(function (d) {
    return retention_yScale_dist(d.DIST_NET_RETENTION);
  }).curve(d3.curveCardinal.tension(0.5)); //smooth the line
  //canvas

  var retention_svg = d3.select('#retention_container').append('svg').attr('preserveAspectRatio', 'xMinYMin meet') // This forces uniform scaling for both the x and y, aligning the midpoint of the SVG object with the midpoint of the container element.
  .attr('viewBox', '0 0 600 400') //define the aspect ratio, the inner scaling of object lengths and coordinates
  .attr('class', 'svg-content');
  var retention_chartGroup = retention_svg.append('g').attr('class', 'chartGroup').attr('transform', 'translate(' + retention_margin.left + ',' + retention_margin.top + ')');
  var r_legendContainer = d3.select('#retention_control .row').append('svg').attr('class', 'retention_legend col-5');
  var retention_sd_arr = sd_arr.slice(); //populate dropdown menu

  for (var i = 0; i < retention_sd_arr.length; i++) {
    var opt = retention_sd_arr[i];
    d3.select('#retention_distDropdown .list').append('div').text(opt) //take the sd number (first 4 letters) as value
    .attr('data-value', opt.substring(0, 4));
  }

  ;

  function retentionClear() {
    //clear existing line
    var provLine = d3.selectAll('#retention_container .prov_retention_line');
    provLine.exit();
    provLine.transition().duration(500).remove();
    var distLine = d3.selectAll('#retention_container .dist_retention_line');
    distLine.exit();
    distLine.transition().duration(500).remove(); //clear existing legends

    var existingLegend = d3.selectAll('.retention_legend .chart_legend');
    existingLegend.exit();
    existingLegend.transition().duration(100).remove(); //clear tooltips 

    retention_chartGroup.selectAll('.retentiontt_circle').remove();
    d3.selectAll('.retentiontt_rect').remove();
  }

  d3.csv('./assets/raw_data/retention_province.csv', function (error, data) {
    if (error) {
      throw error;
    }

    var targetSd = 'Southeast Kootenay';
    var provData = data;
    provData.forEach(function (d) {
      d.SCHOOL_YEAR = parseDate(d.SCHOOL_YEAR).getFullYear();
      d.PROV_NET_RETENTION = +d.PROV_NET_RETENTION;
    });

    function retentionUpdate(dist) {
      d3.csv('./assets/raw_data/retention_district.csv', function (error, data) {
        if (error) {
          throw error;
        }

        var yAxis_dist_label = 'Change in Full Course Load - District';
        var yAxis_prov_label = 'Change in Full Course Load - Province';
        var districtData = data.filter(function (d) {
          return +d.DISTRICT == dist;
        });
        districtData.forEach(function (d) {
          d.SCHOOL_YEAR = parseDate(d.SCHOOL_YEAR).getFullYear();
          d.DIST_NET_RETENTION = +d.DIST_NET_RETENTION;
        }); //set scale domain

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
        })]); //tooltips

        var retentiontt = retention_chartGroup.append('g').attr('class', 'retentiontt').style('display', 'none'); //tt line

        retentiontt.append('line').attr('class', 'retentiontt_line').attr("y1", 0).attr("y2", retention_height); //tt info rect, since z-index doesnt work for svg elments, draw later

        d3.select('#retention_container').append('div').attr('class', 'retentiontt_rect').style('display', 'none'); //overlay, to triger tt

        retention_svg.append('rect').attr("transform", "translate(" + retention_margin.left + "," + retention_margin.top + ")").attr("class", "retention_overlay").attr("width", retention_width).attr("height", retention_height).on("mouseover", function () {
          retentiontt.style("display", null);
        }).on("mouseleave", function () {
          retentiontt.style("display", "none");
          d3.selectAll(".retentiontt_rect").style('display', 'none');
          retention_chartGroup.selectAll(".retentiontt_circle").style('display', 'none');
        }).on("mousemove", showRetentiontt);
        var currentPos; // custom invert function for point scale + tooltips

        function showRetentiontt() {
          var xPos = d3.mouse(this)[0];
          var domain = retention_xScale.domain();
          var range = retention_xScale.range();
          var rangePoints = d3.range(range[0], range[1], retention_xScale.step());
          currentPos = domain[d3.bisect(rangePoints, xPos) - 1];
          console.log(currentPos);

          if (currentPos) {
            retentiontt.select(".retentiontt_line").attr("x1", retention_xScale(currentPos));
            retentiontt.select(".retentiontt_line").attr("x2", retention_xScale(currentPos));
            retention_chartGroup.selectAll(".retentiontt_circle").style('display', 'none'); // select circles for the current year (mouse over)

            retention_chartGroup.selectAll("circle[cx='" + retention_xScale(currentPos) + "']").style('display', null); //difference btween contianer div and svg canvas

            var oBox = document.getElementById('retention_container').getBoundingClientRect();
            var svgSacle = oBox.width / 600;
            d3.select(".retentiontt_rect").style('display', null).html(function () {
              var content = "<div class='tipHeader'><b>Year: </b>" + currentPos + "</div>";
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = provData[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var d = _step.value;
                  if (d.SCHOOL_YEAR == currentPos) content += "<div class='tipInfo' data-num='" + d.PROV_NET_RETENTION + "'>Province: <span class='tipNum'>" + d.PROV_NET_RETENTION + "</span></div>";
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }

              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = districtData[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var d2 = _step2.value;
                  if (d2.SCHOOL_YEAR == currentPos && (d2.DISTRICT = dist)) content += "<div class='tipInfo' data-num='" + d2.DIST_NET_RETENTION + "'>" + targetSd + ": <span class='tipNum'>" + d2.DIST_NET_RETENTION + "</span></div>";
                }
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                    _iterator2.return();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }

              return content;
            }); //sort html elements based on value

            var tipBox = $('.retentiontt_rect');
            tipBox.find('.tipInfo').sort(function (a, b) {
              return +b.getAttribute('data-num') - +a.getAttribute('data-num');
            }).appendTo(tipBox);

            if (currentPos == 2018) {
              d3.select(".retentiontt_rect").style('left', retention_xScale(currentPos) * svgSacle - 60 * svgSacle + 'px');
            } else {
              d3.select(".retentiontt_rect").style('left', retention_xScale(currentPos) * svgSacle + 70 * svgSacle + 'px');
              ;
            }
          }
        } //draw liens


        var prov_retention_line = retention_chartGroup.append('path').datum(provData).attr('class', 'prov_retention_line').attr('d', prov_line).attr('fill', 'none').attr('stroke-width', '2');
        var dist_retention_line = retention_chartGroup.append('path').datum(districtData).attr('class', 'dist_retention_line').attr('d', dist_line).attr('fill', 'none').attr('stroke-width', '2'); //animate path

        var plineLength = prov_retention_line.node().getTotalLength();
        var dlineLength = dist_retention_line.node().getTotalLength();
        prov_retention_line.attr("stroke-dasharray", plineLength + " " + plineLength).attr("stroke-dashoffset", plineLength).transition().duration(1500).attr("stroke-dashoffset", 0);
        dist_retention_line.attr("stroke-dasharray", dlineLength + " " + dlineLength).attr("stroke-dashoffset", dlineLength).transition().duration(1500).attr("stroke-dashoffset", 0); //legends

        var retention_legend = r_legendContainer.append('g').attr('class', 'chart_legend');
        retention_legend.append('rect').attr('x', 10).attr('y', 20).attr('width', 18).attr('height', 18).style('fill', '#002663');
        retention_legend.append('text').attr('x', 30).attr('y', 35).text('Province');
        retention_legend.append('rect').attr('x', 10).attr('y', 50).attr('width', 18).attr('height', 18).style('fill', '#FCBA19');
        retention_legend.append('text').attr('x', 30).attr('y', 65).text(targetSd); //tooltips circle

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = districtData[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _dist = _step3.value;
            retention_chartGroup.append('circle').attr('class', 'retentiontt_circle').attr('r', '5').attr('cx', retention_xScale(_dist.SCHOOL_YEAR)).attr('cy', retention_yScale_dist(_dist.DIST_NET_RETENTION)).style('fill', '#FCBA19').style('display', 'none');
          } //tooltips circle

        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = provData[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var prov = _step4.value;
            retention_chartGroup.append('circle').attr('class', 'retentiontt_circle').attr('r', '5').attr('cx', retention_xScale(prov.SCHOOL_YEAR)).attr('cy', retention_yScale_prov(prov.PROV_NET_RETENTION)).style('fill', '#002663').style('display', 'none');
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        if ($('#retention_container .yAxis_dist').length) {
          //set transition
          var tran = d3.transition().duration(1500);
          d3.select('#retention_container .yAxis_dist').transition(tran).call(retention_yAxis_dist);
          d3.select('#retention_container .yAxis_prov').transition(tran).call(retention_yAxis_prov);
          d3.select('#retention_container .xAxis').transition(tran).call(retention_xAxis);
        } else {
          //axes
          retention_chartGroup.append('g').attr('class', 'yAxis_dist').call(retention_yAxis_dist).append('text').attr('transform', 'rotate(-90)').attr('class', 'axis_label').attr('x', -retention_height / 2).attr("y", -45).attr('text-anchor', 'middle').text(yAxis_dist_label);
          retention_chartGroup.append('g').attr('class', 'yAxis_prov').attr('transform', 'translate( ' + retention_width + ', 0 )').call(retention_yAxis_prov).append('text').attr('transform', 'rotate(-90)').attr('class', 'axis_label').attr('x', -retention_height / 2).attr("y", 60).attr('text-anchor', 'middle').text(yAxis_prov_label);
          retention_chartGroup.append('g').attr('class', 'xAxis').attr('transform', 'translate(0,' + retention_height + ')').call(retention_xAxis);
        }
      });
    } //default district


    retentionUpdate('05'); //dropdown select district
    //removes event handlers from selected elements as updateGraph

    $('#retention_distDropdown').unbind().on('click', function () {
      $('.dropDown').not(this).removeClass('active');
      $(this).toggleClass('active'); //or add on click when appending the divs

      d3.selectAll('#retention_distDropdown .list div').on('click', function () {
        $('#retention_distDropdown span').text($(this).text());
        $('#retention_distDropdown').attr('attr', 'dropDown'); //reset target district 

        targetSd = $(this).text();
        targetSd = targetSd.substring(5, targetSd.length);
        targetDistrict = d3.select(this).attr('data-value').substring(2, 4);
        retentionClear();
        retentionUpdate(targetDistrict);
      });
    });
  });
});

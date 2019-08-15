
$(document).ready(function () {
  //margin
  var demo_margin = {
    top: 10,
    right: 20,
    bottom: 50,
    left: 80
  }; //height and width

  var demo_height = 400 - demo_margin.top - demo_margin.bottom;
  var demo_width = 600 - demo_margin.left - demo_margin.right; //scales

  var demo_xScale = d3.scalePoint().range([0, demo_width]).padding(0.5);
  var demo_yScale = d3.scaleLinear().range([demo_height, 0]); //create color scale

  var color_arr = ['#6699CC', '#99C794', '#5FB3B3', '#EC5F67', '#F99157', '#FAC863', '#C594C5', '#AB7967'];
  var demo_color = d3.scaleOrdinal(color_arr); //axes

  var demo_xAxis = d3.axisBottom().scale(demo_xScale);
  var demo_yAxis = d3.axisLeft().scale(demo_yScale).tickSizeOuter(0).tickSize(-demo_width).tickPadding(20); //canvas

  var demo_svg = d3.select('#demo_container').append('svg').attr("preserveAspectRatio", "xMinYMin meet") // This forces uniform scaling for both the x and y, aligning the midpoint of the SVG object with the midpoint of the container element.
  .attr("viewBox", "0 0 600 400") //define the aspect ratio, the inner scaling of object lengths and coordinates
  .attr('class', 'svg-content');
  var demo_chartGroup = demo_svg.append('g').attr('class', 'chartGroup').attr("transform", "translate(" + demo_margin.left + "," + demo_margin.top + ")");
  var legendContainer = d3.select('#demo_legend').append('svg').attr('height', '160px').append('g').attr('class', 'legendContainer');
  d3.csv('./assets/raw_data/demographics.csv', function (error, data) {
    if (error) {
      throw error;
    } //array of selected district (objects), used to draw lines


    var defaultDistrict = ['SD99-Province'];
    var defaultType = 'NEW_KINDERGARTEN';
    var yAxis_label = 'Number of Students';

    function demoClear() {
      //clear existing line
      var existingPath = d3.selectAll("#demo_container .demo_line");
      existingPath.exit();
      existingPath.transition().duration(500).remove(); //clear existing legends

      var existingLegend = d3.selectAll("#demo_legend .legend");
      existingLegend.exit();
      existingLegend.transition().duration(100).remove(); //clear tooltips 

      demo_chartGroup.selectAll(".demott_circle").remove();
      d3.selectAll(".demott_rect").remove();
    }

    function demoUpdate(type, selectedDistricts) {
      //array of all selected, used to set axes
      var districtData = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop2 = function _loop2() {
          var dist = _step.value;
          var district = data.filter(function (d) {
            return d.DISTRICT == dist.substring(2, 4);
          }); // format the data

          district.forEach(function (d) {
            d.SCHOOL_YEAR = parseDate(d.SCHOOL_YEAR).getFullYear();
            d.NEW_KINDERGARTEN = +d.NEW_KINDERGARTEN;
            d.GRADUATES = Math.abs(+d.GRADUATES);
            d.NET = +d.NET;
          }); // concat method doesn't change the original array, need to reassign it.

          districtData = districtData.concat(district);
        };

        for (var _iterator = selectedDistricts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop2();
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

      console.log(districtData); //tooltips

      var demott = demo_chartGroup.append('g').attr('class', 'demott').style('display', 'none'); //tt line

      demott.append('line').attr('class', 'demott_line').attr("y1", 0).attr("y2", demo_height); //tt info rect, since z-index doesnt work for svg elments, draw later

      d3.select('#demo_container').append('div').attr('class', 'demott_rect').style('display', 'none'); //overlay, to triger tt

      demo_svg.append('rect').attr("transform", "translate(" + demo_margin.left + "," + demo_margin.top + ")").attr("class", "demo_overlay").attr("width", demo_width).attr("height", demo_height).on("mouseover", function () {
        demott.style("display", null);
      }).on("mouseleave", function () {
        demott.style("display", "none");
        d3.selectAll(".demott_rect").style('display', 'none');
        demo_chartGroup.selectAll(".demott_circle").style('display', 'none');
      }).on("mousemove", showDemott);
      var currentPos;

      function showDemott() {
        // custom invert function for point scale + tooltips
        var xPos = d3.mouse(this)[0];
        var domain = demo_xScale.domain();
        var range = demo_xScale.range();
        var rangePoints = d3.range(range[0], range[1], demo_xScale.step());
        currentPos = domain[d3.bisect(rangePoints, xPos) - 1];

        if (currentPos) {
          demott.select(".demott_line").attr("x1", demo_xScale(currentPos));
          demott.select(".demott_line").attr("x2", demo_xScale(currentPos));
          demo_chartGroup.selectAll(".demott_circle").style('display', 'none'); // select circles for the current year (mouse over)

          demo_chartGroup.selectAll("circle[cx='" + demo_xScale(currentPos) + "']").style('display', null); //difference btween contianer div and svg canvas

          var oBox = document.getElementById('demo_container').getBoundingClientRect();
          var svgSacle = oBox.width / 600;
          d3.select(".demott_rect").style('display', null).html(function () {
            var content = "<div class='tipHeader'><b>Year: </b>" + currentPos + "</div>";
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = selectedDistricts[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var d = _step2.value;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                  for (var _iterator3 = districtData[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var d2 = _step3.value;
                    if (d2.DISTRICT == d.substring(2, 4) && d2.SCHOOL_YEAR == currentPos) content += "<div class='tipInfo' data-num='" + d2[type] + "'>" + d.substring(5, d.length) + ": <span class='tipNum'>" + d2[type].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>";
                  }
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

          var tipBox = $('.demott_rect');
          tipBox.find('.tipInfo').sort(function (a, b) {
            return +b.getAttribute('data-num') - +a.getAttribute('data-num');
          }).appendTo(tipBox);

          if (currentPos == 2018) {
            d3.select(".demott_rect").style('left', demo_xScale(currentPos) * svgSacle - 40 * svgSacle + 'px');
          } else {
            d3.select(".demott_rect").style('left', demo_xScale(currentPos) * svgSacle + 100 * svgSacle + 'px');
            ;
          }
        }
      } // use for loop for positioning the legend


      var _loop = function _loop(i) {
        var district = data.filter(function (d) {
          return d.DISTRICT == selectedDistricts[i].substring(2, 4);
        }); //set scale domain (combined districtData[])

        demo_xScale.domain(districtData.map(function (d) {
          return d.SCHOOL_YEAR;
        }));

        if (selectedDistricts[i] == 'SD99-Province') {
          var radioValue = $("input[name='demo-type']:checked").val();

          if (radioValue != 'NET') {
            demo_yScale.domain([Math.min(35000, d3.min(districtData, function (d) {
              return d[type];
            })), Math.max(-35000, d3.max(districtData, function (d) {
              return d[type];
            }))]);
          } else {
            demo_yScale.domain([Math.min(0, d3.min(districtData, function (d) {
              return d[type];
            })), Math.max(0, d3.max(districtData, function (d) {
              return d[type];
            }))]);
          }
        } else {
          demo_yScale.domain([Math.min(0, d3.min(districtData, function (d) {
            return d[type];
          })), Math.max(0, d3.max(districtData, function (d) {
            return d[type];
          }))]);
        } //line generator 


        var demoLine = d3.line().x(function (d) {
          return demo_xScale(d.SCHOOL_YEAR);
        }).y(function (d) {
          return demo_yScale(d[type]);
        }).curve(d3.curveCardinal.tension(0.85)); //smooth the line, round corner;
        //draw line

        var demo_line = demo_chartGroup.append('path').datum(district).attr('class', 'demo_line').attr('d', demoLine).attr('fill', 'none').attr("stroke-width", "2").attr('stroke', demo_color(selectedDistricts[i])); // draw legend

        var legend = legendContainer.append('g').attr('class', 'legend');
        legend.append("rect").attr("x", 10).attr("y", i * 20).attr("width", 18).attr("height", 18).style("fill", demo_color(selectedDistricts[i]));
        legend.append("text").attr("x", 30).attr("y", 15 + i * 20).text(selectedDistricts[i]); //tooltips info

        d3.select('.demott').append('div').text(selectedDistricts[i]); //animate path

        var totalLength = demo_line.node().getTotalLength(); // console.log(totalLength);

        demo_line.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(1500).attr("stroke-dashoffset", 0); //tooltips circle

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = district[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var dist = _step4.value;
            demo_chartGroup.append('circle').attr('class', 'demott_circle').attr('r', '5').attr('cx', demo_xScale(dist.SCHOOL_YEAR)).attr('cy', demo_yScale(dist[type])).style('fill', demo_color(selectedDistricts[i])).style('display', 'none');
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
      };

      for (var i = 0; i < selectedDistricts.length; i++) {
        _loop(i);
      }

      if ($('#demo_container .yAxis').length) {
        //set transition
        var tran = d3.transition().duration(1500);
        d3.select("#demo_container .yAxis").transition(tran).call(demo_yAxis);
        d3.select("#demo_container .xAxis").transition(tran).call(demo_xAxis);
      } else {
        //axes
        demo_chartGroup.append('g').attr('class', 'yAxis').call(demo_yAxis).append("text").attr("transform", "rotate(-90)").attr('class', 'axis_label').attr('x', -demo_height / 2).attr("y", -60).attr('text-anchor', 'middle').text(yAxis_label);
        demo_chartGroup.append('g').attr('class', 'xAxis').attr('transform', 'translate(0,' + demo_height + ')').call(demo_xAxis); //grid line

        d3.selectAll("g.yAxis g.tick").append("line").attr("class", "gridline").attr("x1", 0).attr("y1", 0).attr("x2", demo_width).attr("y2", 0);
      }
    }

    demoUpdate(defaultType, defaultDistrict);
    /******control******/
    //radio selection

    $("input[type='radio']").change(function () {
      var radioValue = $("input[name='demo-type']:checked").val();

      if (radioValue) {
        demoClear();
        demoUpdate(radioValue, defaultDistrict);
      }
    }); //checkbox list in modal, sd_arr (list of districts) is a global array from predictors section
    //value= '" + dist + "' has to be quoted like this, since val contains space

    $.each(sd_arr, function (index, dist) {
      var checkbox = "<div class='checkbox'><label><input type='checkbox' id=" + dist.substring(2, 4) + " class='demo_checkbox' value= '" + dist + "'><span>" + dist.substring(2, dist.length) + "</span></label></div>";
      $(".modal-body").append($(checkbox));
    });
    $(".modal-body").append("<div class='checkbox'><label><input type='checkbox' id='99' class='demo_checkbox' value= 'SD99-Province' checked><span>99-Province</span></label></div>"); //set the selection limit

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
      var radioValue = $("input[name='demo-type']:checked").val();
      console.log(radioValue);
      demoClear();
      demoUpdate(radioValue, defaultDistrict);
    });
  });
});
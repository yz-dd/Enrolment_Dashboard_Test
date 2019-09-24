$(document).ready(function () {
  //trans_margin 
  var trans_margin = {
    top: 50,
    right: 30,
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

  var trans_height = 400 - trans_margin.top - trans_margin.bottom;
  var trans_width = 600 - trans_margin.left - trans_margin.right;
  var trans_xScale = d3.scaleLinear().range([0, trans_width]);
  var trans_yScale = d3.scaleLinear().range([trans_height, 0]);
  var trans_yAxis = d3.axisLeft().scale(trans_yScale).tickSize(-trans_width).tickPadding(20);
  var trans_xAxis = d3.axisBottom().scale(trans_xScale).tickSize(-trans_height).tickPadding(20).ticks(5); //canvas

  var trans_svg = d3.select('#transition_container').append('svg').attr("preserveAspectRatio", "xMinYMin meet") // This forces uniform scaling for both the x and y, aligning the midpoint of the SVG object with the midpoint of the container element.
  .attr("viewBox", "0 0 600 400") //defines the aspect ratio, the inner scaling of object lengths and coordinates
  .attr('class', 'svg-content');
  var trans_chartGroup = trans_svg.append('g').attr('class', 'chartGroup').attr('transform', 'translate(' + trans_margin.left + ',' + trans_margin.top + ')'); //initialize html tooltip

  var trans_tooltip = d3.select("#transition_container").append("div").attr("class", "tt_container").attr("id", "trans_tt").style("display", "none"); //slider
  //Create SVG element for slider

  var tslider_width = $('#trans_slider').width();
  transition_slider();
  var trans_type = 'ENTER_PUBLIC';
  var trans_dist = 'TOP5';
  var trans_year = 2013;
  graphUpdate(trans_year);
  transUpdate(trans_year, trans_dist, trans_type);
  $(window).resize(function () {
    d3.select('#trans_slider svg').remove();
    tslider_width = $('#trans_slider').width();
    transition_slider();
  });

  function transition_slider() {
    var tslider_slider = d3.select("#trans_slider").append("svg").attr("width", tslider_width).attr("height", 50);
    var tsliderGroup = tslider_slider.append("g").attr('transform', 'translate(20, 20)');
    ;
    var tslider_moving = false;
    var tslider_currentValue = 0;
    var tslider_targetValue = tslider_width - 50;
    var tslider_years = [2013, 2018];
    var tslider_step = 1; // array useful for step sliders

    var tslider_yearValues = d3.range(tslider_years[0], tslider_years[1], tslider_step || 1).concat(tslider_years[1]); //scales

    var tslider_xScale = d3.scaleLinear().domain(tslider_years).range([0, tslider_targetValue]).clamp(true).nice(); //create track

    tsliderGroup.append("line").attr("class", "track").attr("x1", tslider_xScale.range()[0]).attr("x2", tslider_xScale.range()[1]).select(function () {
      return this.parentNode.appendChild(this.cloneNode(true));
    }).attr("class", "track-inset").select(function () {
      return this.parentNode.appendChild(this.cloneNode(true));
    }).attr("class", "track-overlay").call(d3.drag().on("start.interrupt", tslider_startDrag).on("drag", tslider_drag).on("end", tslider_end)); //create track overlay

    tsliderGroup.insert("g", ".track-overlay").attr("class", "ticks").attr("transform", "translate(0, 18)").selectAll("text").data(tslider_xScale.ticks(6)).enter().append("text").attr("x", tslider_xScale).attr("y", 10).attr("text-anchor", "middle").text(function (d) {
      return d;
    }); //slider handle

    var tslider_handle = tsliderGroup.selectAll("rect").data([0, 1]).enter().append('rect', '.track-overlay').attr("class", "handle").attr('rx', 3).attr('ry', 3).attr('x', -8).attr('y', -10).attr("width", 16).attr("height", 20).call(d3.drag().on("start.interrupt", tslider_startDrag).on("drag", tslider_drag).on("end", tslider_end));

    function tslider_startDrag(d) {
      tsliderGroup.interrupt();
      d3.select(this).raise().classed('active', true);
    }

    function tslider_drag(d) {
      var x = d3.event.x;
      var xMin = tslider_xScale(tslider_years[0]),
          xMax = tslider_xScale(tslider_years[1]);

      if (x > xMax) {
        x = xMax - 10;
      } else if (x < xMin) {
        x = xMin;
      }

      tslider_handle.attr('x', x);
    }

    function tslider_end(d) {
      // console.log('dragged');
      currentValue = d3.event.x;
      d3.select(this).classed('active', false);
      trans_tooltip.style("display", "none");
      d3.selectAll('.trans_circ').style('fill', '#002663');
      tslider_inputYear(currentValue);
    } //flag for checking update() year input


    var tslider_yrCheck = 0;

    function tslider_inputYear(val) {
      // console.log(val);
      var x = tslider_xScale.invert(val);
      var index = null,
          midPoint,
          cx,
          xVal;

      if (tslider_step) {
        // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
        for (var i = 0; i < tslider_yearValues.length; i++) {
          if (x >= tslider_yearValues[i] && x <= tslider_yearValues[i + 1]) {
            index = i;
            break;
          }
        }

        midPoint = (tslider_yearValues[index] + tslider_yearValues[index + 1]) / 2;

        if (x < midPoint) {
          cx = tslider_xScale(tslider_yearValues[index]);
          xVal = tslider_yearValues[index];
        } else {
          cx = tslider_xScale(tslider_yearValues[index + 1]);
          xVal = tslider_yearValues[index + 1];
        }
      } else {
        // if step is null or 0, return the drag value as is
        cx = tslider_xScale(x);
        xVal = x.toFixed(3);
      } // update position and text of label according to slider scale


      tslider_handle.attr("x", cx - 8); //verify that a method was called with certain year input, call update() with unique each year value once

      if (tslider_yrCheck != xVal) {
        trans_chartGroup.selectAll('.trans_top5_label').transition().duration(500).remove();
        graphUpdate(xVal);
        transUpdate(xVal, trans_dist, trans_type);
        tslider_yrCheck = xVal;
        trans_year = xVal;
        console.log(trans_year, trans_dist, trans_type);
      }
    }
  }

  function graphUpdate(year) {
    d3.csv('./assets/raw_data/transition_province.csv', function (error, data) {
      if (error) {
        throw error;
      }

      var yrData = data.filter(function (d) {
        return +d.SCHOOL_YEAR == year;
      });
      yrData.forEach(function (d) {
        d.RATE_PtoI = +d.RATE_PtoI;
        d.RATE_ItoP = +d.RATE_ItoP;
      });
      d3.select('#pub_to_ind').text(yrData.map(function (d) {
        return Math.round(Math.abs(d.LEAVE_PUBLIC)) + '  (' + d.RATE_PtoI + '%)';
      }));
      d3.select('#ind_to_pub').text(yrData.map(function (d) {
        return Math.round(d.ENTER_PUBLIC) + '  (' + d.RATE_ItoP + '%)';
      }));
    });
  }

  function transClear() {
    //clear existing trans_circs
    var existingCirc = trans_chartGroup.selectAll(".trans_circ");
    existingCirc.transition().duration(500).remove();
    trans_chartGroup.selectAll('.label').transition().duration(500).remove();
    trans_chartGroup.selectAll('.trans_top5_label').transition().duration(500).remove();
  }

  function transUpdate(year, dist, type) {
    d3.csv('./assets/raw_data/transition_district.csv', function (error, data) {
      if (error) {
        throw error;
      }

      var yAxis_label = 'Transition in Funded FTE';
      var xAxis_label = 'District Enrolment in Funded FTE';
      var distData = data.filter(function (d) {
        return +d.SCHOOL_YEAR == year;
      }); //format data

      distData.forEach(function (d) {
        d.ENTER_PUBLIC = +d.ENTER_PUBLIC;
        d.LEAVE_PUBLIC = +d.LEAVE_PUBLIC;
        d.NET_INDEPENDENT = +d.NET_INDEPENDENT;
        d.LAST_YEAR_ENROLMENT = +d.LAST_YEAR_ENROLMENT;
      });
      var districtData;

      if (dist == 'TOP5') {
        //sort array of object based on # of enter, leave, and net
        distData.sort(function (a, b) {
          //# of leave is negative, reverse sort
          if (type == 'LEAVE_PUBLIC') {
            return a[type] - b[type];
          } else {
            return b[type] - a[type];
          }
        }); //top 5 district

        districtData = distData.slice(0, 5);
        console.log(districtData); //set scale domain

        trans_xScale.domain([0, d3.max(districtData, function (d) {
          return d.LAST_YEAR_ENROLMENT;
        })]).nice();

        if (trans_type == 'NET_INDEPENDENT') {
          trans_yScale.domain(d3.extent(districtData, function (d) {
            return d[type];
          })).nice();
        } else {
          trans_yScale.domain(d3.extent(districtData, function (d) {
            return Math.abs(d[type]);
          })).nice();
        }
      } else if (dist == '99') {
        districtData = distData; //set scale domain

        trans_xScale.domain([0, d3.max(districtData, function (d) {
          return d.LAST_YEAR_ENROLMENT;
        })]).nice();

        if (trans_type == 'NET_INDEPENDENT') {
          trans_yScale.domain(d3.extent(districtData, function (d) {
            return d[type];
          })).nice();
        } else {
          trans_yScale.domain(d3.extent(districtData, function (d) {
            return Math.abs(d[type]);
          })).nice();
        }
      } else {
        districtData = distData.filter(function (d) {
          return +d.DISTRICT == dist;
        }); //set scale domain

        trans_xScale.domain([0, d3.max(distData, function (d) {
          return d.LAST_YEAR_ENROLMENT;
        })]).nice();

        if (trans_type == 'NET_INDEPENDENT') {
          trans_yScale.domain(d3.extent(distData, function (d) {
            return d[type];
          })).nice();
        } else {
          trans_yScale.domain(d3.extent(distData, function (d) {
            return Math.abs(d[type]);
          })).nice();
        }
      } //check existing circles, the length of existing (based on previous type selection)
      //will be used to compare with incoming districtData.length.


      var existingCircles = d3.selectAll('.trans_circ');

      if ($('#transition_container .xAxis').length) {
        //set transition
        var tran = d3.transition().duration(1500); // console.log(dist);
        // console.log(distData);
        // console.log(districtData);
        // console.log(existingCircles.nodes().length);
        // if the length matches, update cx, cy coordinates only,no need to rebind nodes

        if (districtData.length == existingCircles.nodes().length) {
          trans_chartGroup.selectAll('.trans_circ').data(districtData).transition(tran).attr('cx', function (d) {
            return trans_xScale(d.LAST_YEAR_ENROLMENT);
          }).attr('cy', function (d) {
            if (trans_type == 'NET_INDEPENDENT') {
              return trans_yScale(d[type]);
            } else {
              return trans_yScale(Math.abs(d[type]));
            }
          });
        } else {
          trans_chartGroup.selectAll('.trans_circ').exit().remove().data(districtData).enter().append('circle').attr('class', 'trans_circ').attr('cx', function (d) {
            return trans_xScale(d.LAST_YEAR_ENROLMENT);
          }).attr('cy', function (d) {
            if (trans_type == 'NET_INDEPENDENT') {
              return trans_yScale(d[type]);
            } else {
              return trans_yScale(Math.abs(d[type]));
            }
          }).attr('r', 10).on('click', function (d) {
            //gets mouse coordinates on screen
            var offsetTarget = $(this).parent().parent().parent().parent();
            console.log(offsetTarget);
            var offset = offsetTarget.offset();
            var mx = event.pageX - offset.left;
            var my = event.pageY - offset.top;
            d3.selectAll('.trans_circ').style('fill', '#002663');
            d3.select(this).style('fill', '#FCBA19'); // console.log(type, trans_type);

            if (trans_type == 'NET_INDEPENDENT') {
              showTranstt(d.DISTRICT, trans_year, d[trans_type], trans_type, mx, my);
            } else {
              showTranstt(d.DISTRICT, trans_year, Math.abs(d[trans_type]), trans_type, mx, my);
            }
          });
        }

        if (districtData.length <= 5) {
          trans_chartGroup.selectAll(".trans_top5_label").exit().remove().data(districtData).enter().append('text').style("opacity", 0).attr('class', 'trans_top5_label').attr('x', function (d) {
            return trans_xScale(d.LAST_YEAR_ENROLMENT);
          }).attr("y", function (d) {
            if (trans_type == 'NET_INDEPENDENT') {
              return trans_yScale(d[type]) + 20;
            } else {
              return trans_yScale(Math.abs(d[type]) - 40);
            }
          }).attr('text-anchor', 'middle').text(function (d) {
            var sd = d.DISTRICT;
            var dist;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = sd_arr[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _d = _step.value;

                if (_d.includes(sd.toString())) {
                  dist = _d;
                }
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

            return dist.substring(5, dist.length);
          }).transition(tran).style("opacity", 1);
        }

        d3.select("#transition_container .yAxis").transition(tran).call(trans_yAxis);
        d3.select("#transition_container .xAxis").transition(tran).call(trans_xAxis);
      } else if (!$('#transition_container .xAxis').length) {
        //draw trans_circs
        trans_chartGroup.selectAll('.trans_circ').data(districtData).enter().append('circle').attr('class', 'trans_circ').attr('cx', function (d) {
          return trans_xScale(d.LAST_YEAR_ENROLMENT);
        }).attr('cy', function (d) {
          if (trans_type == 'NET_INDEPENDENT') {
            return trans_yScale(d[type]);
          } else {
            return trans_yScale(Math.abs(d[type]));
          }
        }).attr('r', 10).on('click', function (d) {
          //gets mouse coordinates on screen
          var offsetTarget = $(this).parent().parent().parent().parent();
          console.log(offsetTarget);
          var offset = offsetTarget.offset();
          var mx = event.pageX - offset.left;
          var my = event.pageY - offset.top;
          console.log(mx, my);
          d3.selectAll('.trans_circ').style('fill', '#002663');
          d3.select(this).style('fill', '#FCBA19');

          if (trans_type == 'NET_INDEPENDENT') {
            showTranstt(d.DISTRICT, trans_year, d[trans_type], trans_type, mx, my);
          } else {
            showTranstt(d.DISTRICT, trans_year, Math.abs(d[trans_type]), trans_type, mx, my);
          }
        }); //only label top 5 and individual district

        if (districtData.length <= 5) {
          trans_chartGroup.selectAll(".trans_top5_label").data(districtData).enter().append('text').attr('class', 'trans_top5_label').attr('x', function (d) {
            return trans_xScale(d.LAST_YEAR_ENROLMENT);
          }).attr("y", function (d) {
            if (trans_type == 'NET_INDEPENDENT') {
              return trans_yScale(d[type]) + 20;
            } else {
              return trans_yScale(Math.abs(d[type]) - 40);
            }
          }).attr('text-anchor', 'middle').text(function (d) {
            var sd = d.DISTRICT;
            var dist;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = sd_arr[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _d2 = _step2.value;

                if (_d2.includes(sd.toString())) {
                  dist = _d2;
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

            return dist.substring(5, dist.length);
          });
        } //axes


        trans_chartGroup.append('g').attr('class', 'yAxis').call(trans_yAxis).append("text").attr("transform", "rotate(-90)").attr('class', 'axis_label').attr('x', -trans_height / 2).attr("y", -45).attr('text-anchor', 'middle').text(yAxis_label);
        trans_chartGroup.append('g').attr('class', 'xAxis').attr('transform', 'translate(0,' + trans_height + ')').call(trans_xAxis).append("text").attr('class', 'axis_label').attr('x', trans_width / 2).attr("y", 50).style("text-anchor", "middle").text(xAxis_label);
        ;
      } //click on anything else close tooltip


      document.addEventListener('click', function (e) {
        if (e.target.closest('.trans_circ')) return;
        d3.select('#trans_tt').style('display', 'none');
        d3.selectAll('.trans_circ').style('fill', '#002663');
      });
    });
  } // populate dist dropdown


  var trans_dd = d3.select('#trans_dist_dropdown .list');
  trans_dd.append('div').text('Top 5 districts').attr('data-value', 'TOP5');
  trans_dd.append('div').text('SD99-Province (all districts)').attr('data-value', 'SD99');
  var transition_sd_arr = sd_arr.slice();

  for (var i = 0; i < transition_sd_arr.length; i++) {
    var opt = transition_sd_arr[i];
    d3.select('#trans_dist_dropdown .list').append('div').text(opt) //take the sd number (first 4 letters) as value
    .attr('data-value', opt.substring(0, 4));
  }

  ; //dist dropdown multiselect

  $('#trans_dist_dropdown').on('click', function () {
    $('.dropDown').not(this).removeClass('active');
    $(this).toggleClass('active');
    d3.selectAll('#trans_dist_dropdown .list div').on('click', function () {
      var dist = d3.select(this).attr('data-value');

      if (dist != 'TOP5') {
        dist = dist.substring(2, 4);
      }

      trans_dist = dist;
      $('#trans_dist_dropdown span').text($(this).text());

      if (dist) {
        transClear();
        transUpdate(trans_year, dist, trans_type);
      }
    });
  }); //type dropdown

  $('#trans_type_dropdown').on('click', function (e) {
    $('.dropDown').not(this).removeClass('active');
    $(this).toggleClass('active');
    d3.selectAll('#trans_type_dropdown .list div').on('click', function () {
      var typeValue = d3.select(this).attr('data-value');
      $('#trans_type_dropdown span').text($(this).text());
      trans_type = typeValue;

      if (typeValue) {
        transClear();
        transUpdate(trans_year, trans_dist, typeValue);
      }

      console.log(trans_year, trans_dist, trans_type);
    });
  });

  function showTranstt(sd, yr, num, type, mx, my) {
    if (mx < 120) {
      mx = 120;
    } else if (mx > 500) {
      mx = 500;
    }

    ;

    if (my < 40) {
      my = 40;
    }

    ;

    if (my > 220) {
      my = 220;
    }

    ; //check if sd_arr string coontains sd district number 

    var dist;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = sd_arr[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var d = _step3.value;

        if (d.includes(sd.toString())) {
          dist = d;
        }
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

    ;
    d3.select('#trans_tt').style("top", my + "px").style("left", mx + "px").style('display', null).html(function () {
      var content = "<div class='tipHeader'><b>" + dist + "</b></div>";

      if (type == 'ENTER_PUBLIC') {
        content += "<div class='tipInfo'>" + parseInt(num) + " students entered from independent schools in " + yr + ".</div>";
      } else if (type == 'LEAVE_PUBLIC') {
        content += "<div class='tipInfo'>" + parseInt(num) + " students left for independent schools in " + yr + ".</div>";
      } else {
        if (parseInt(num) >= 0) {
          content += "<div class='tipInfo'>" + parseInt(num) + " students (Net inflow) entered from independent schools in " + yr + ".</div>";
        } else {
          content += "<div class='tipInfo'>" + parseInt(num) + " students (Net outflow) left for independent schools in " + yr + ".</div>";
        }
      }

      content += "<div class='trans_link'><a class='ssLink' href='https://studentsuccess.gov.bc.ca/school-district/0" + sd + "/report/fsa' target='_blank'>Foundation Skills Assessment<i class='fas fa-angle-right ml-1'></i></a></div>";
      content += "<div class='trans_link'><a class='ssLink' href='https://studentsuccess.gov.bc.ca/school-district/0" + sd + "/report/student-satisfaction' target='_blank'>Student Satisfaction<i class='fas fa-angle-right ml-1'></i></a></div>";
      return content;
    });
  }
});

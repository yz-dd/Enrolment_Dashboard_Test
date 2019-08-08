$(document).ready(function () {
  //Width and height
  let width = 760;
  let height = 600;
  let centered;

  let formatC = d3.format(",.0f");
  let formatD = d3.format("+,.0f");

  //let of min & max number of students move in and out 
  let movein_min, movein_max, moveout_min, moveout_max;

  let colors = ["#65a89d", "#a96a46"]; //color range based on the number of people

  //array used to populate dropdown menu
  let sd_list_arr = [];

  let map = new L.Map("interactiveMap", {
    center: [54, -124],
    zoom: 5
  })
    .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

  //create the projection expression
  // let projection = d3.geoAlbers()
  //   .rotate([122, 0, 0])
  //   .scale(2200)
  //   .translate([width * .57, height * 1.4]);
  // .fitSize([width, height], json);

  //Define path generator
  // let path = d3.geoPath()
  //   .projection(projection);

  let path;

  //create scales
  let circleSize = d3.scaleLinear().domain([0, 300]).range([0, 700]);
  let lineSize = d3.scaleLinear().domain([0, 100]).range([2, 25]);

  // let fillcolor = d3.scaleLinear().range(colors).domain(immdomain);


  //Create SVG element
  // let svg = d3.select("#interactiveMap")
  //   .append("svg")
  //   .attr("width", width)
  //   .attr("height", height);

  let svg = d3.select(map.getPanes().overlayPane).append("svg");

  let chartGroup = svg.append("g").attr("class", "leaflet-zoom-hide");


  let fp = d3.format(".1f"); // format number, 1 place after decimal

  //initialize html tooltip
  let tooltip = d3.select("#interactiveMap")
    .append("div")
    .attr("id", "tlTip")
    .style("z-index", "10")
    .style("position", "absolute")
    .style("visibility", "hidden");

  let tooltip2 = d3.select("#interactiveMap")
    .append("div")
    .attr("id", "tlTip2")
    .style("z-index", "10")
    .style("position", "absolute")
    .style("visibility", "hidden");

  // let chartGroup = svg.append("g");
  let comingData, goingData;
  let currentDist;
  let currentFlowType='all';

  //the BIG function that wraps around the d3 pattern (bind, add, update, remove)
  function updateMap(coming, going) {

    chartGroup.selectAll('.circ').remove().transition()
      .duration(500);

    chartGroup.selectAll('.goingline').remove().transition()
      .duration(500);

    d3.csv(coming, function (data) {
      comingData = data;

      //array contains all coming numbers
      let num_coming_arr = [];

      //loop through the csv, length is the total number of rows(districts)
      for (let i = 0; i < data.length; i++) {
        //for...in statement iterates over all non-Symbol, enumerable properties (columns) of an object(each row)
        for (let stu_num in data[i]) {
          stu_num = parseFloat(data[i][stu_num]); //parseFloat() parses a string and returns a floating point number
          //filter out all NaN
          if (!isNaN(stu_num)) {
            num_coming_arr.push(stu_num);
          }
        }
      }
      /*
           num__coming_arr is not a number, cannot pass into Math.max() directly
           instead, pass an array of arguments:
   
           how to get the min val and exclude 0:
           num_coming_arr.filter creates a new array with all elements that pass the boolean test
   
           for this instance, movein_min returns 0 because 0.xxxx might get rounded to 0
   
           so, use Math.ceil()
           */
      movein_min = Math.ceil(Math.min.apply(Math, num_coming_arr.filter(Boolean)));
      //movein_max will be the max # of total move in, from going csv
    });

    d3.csv(going, function (data) {
      goingData = data;

      console.log(goingData);
      //array contains all going numbers
      let num_going_arr = [];

      //loop through the csv, length is the total number of rows(states)
      for (let i = 0; i < data.length; i++) {
        //for...in statement iterates over all non-Symbol, enumerable properties (columns) of an object(each row)
        for (let stu_num in data[i]) {

          //filter out last two colums (totals)
          stu_num = parseFloat(data[i][stu_num]); //parseFloat() parses a string and returns a floating point number
          //filter out all NaN
          if (!isNaN(stu_num)) {
            num_going_arr.push(stu_num);
          }
        }

        //get both school district numbers and names
        let sd_num = data[i].Abbrev;
        let sd_name = data[i].District;

        sd_list_arr.push(sd_num + '-' + sd_name);
      }

      //stop populate the dropdown list again when changing dataset(2014,15,16...)
      if (sd_list_arr.length <= 61) {
        //populate the dropdown list
        //onsole.log(sd_list_arr);
        for (let i = 0; i < sd_list_arr.length; i++) {
          let opt = sd_list_arr[i];
          console.log(sd_list_arr.length);
          d3.select('#distDropdown .list')
            .append('div')
            .text(opt)
            //take the sd number (first 4 letters) as value
            .attr('data-value', opt.substring(0, 4));
        };
      }


      /* 
      problem here:
      JavaScript engine called hoisting. The parser will read through the entire function before running it, 
      and any letiable declarations (i.e. using the let keyword) will be executed as if they were at the top of the containing scope.
   
      so move.... let is declared throughout the entire scope, 
      but its value is undefined until the following statments run.
      CANNOT USE for the domain[] on top :(
   
      */
      moveout_min = Math.ceil(Math.min.apply(Math, num_going_arr.filter(Boolean)));
      moveout_max = Math.round(Math.max.apply(Math, num_going_arr));
      //console.log(moveout_min, moveout_max);

      //this is for max in movingin column
      data.forEach(function (d) {
        d.total_move_in = parseInt(d.total_move_in);
      });
      movein_max = d3.max(data, function (d) {
        return d.total_move_in;
      });

      let indomain = [moveout_min, moveout_max]; //domain of min-max 
      let outdomain = [movein_min, movein_max];
      let fillcolor = d3.scaleLinear().range(colors).domain(indomain);

      d3.json("../assets/geo_json/sd_geo.json", function (error, json) {
        if (error) throw error;

        /* 
        A custom geometric transformation for Leaflet map
        Converts an input geometry (such as polygons in spherical geographic coordinates) 
        to a different output geometry (such as polygons in projected screen coordinates). 
        */
       function projectPoint(x, y) {
        let point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }

        let transform = d3.geoTransform({
          point: projectPoint
        });
        path = d3.geoPath().projection(transform);

        //loop through the csv, length is the total number of rows(districts)
        for (let i = 0; i < data.length; i++) {
          let dataDistrict = data[i].District; //district names in csv data
          let tempObj = {}; //crate a temp object

          //for...in statement iterates over all non-Symbol, enumerable properties (columns) of an object(each row)
          for (let propt in data[i]) {
            let valz = parseFloat(data[i][propt]); //parseFloat() parses a string and returns a floating point number
            tempObj[propt] = valz;
          }
          //Find the corresponding district inside the GeoJSON
          for (let j = 0; j < json.features.length; j++) {

            let jsonDistrict = json.features[j].properties.SDNAME; //state names in json file

            if (dataDistrict == jsonDistrict) {

              matched = true; //match flag
              //create new properties and add vals in json
              json.features[j].properties.district = dataDistrict;
              json.features[j].id = dataDistrict;
              json.features[j].abbrev = data[i].Abbrev;
              json.features[j].ind = i;

              //loop all propt in this temp object
              for (let propt in tempObj) {
                //check if it's a number
                if (!isNaN(tempObj[propt])) {
                  //add properties&vals to json
                  json.features[j].properties[propt] = tempObj[propt];
                }

              }
              break;
            }
          }
        }

        //Bind data and create one path per GeoJSON feature
        let feature = chartGroup.selectAll("path")
          .data(json.features)
          .enter()
          .append("path")
          .attr("class", "district")
          //add id(district name) to each path (district shape on map)
          .attr("id", function (d) {
            return d.properties.district;
          })
          .attr("d", path) //path here is the geo path generator
          .attr("stroke-width", 0.3)
          .style("stroke", "#494949")
          .style("fill", "#fff")
          .style("fill-opacity", ".6");
        //zoom is a leaflet event
        map.on("zoom", reset);
        map.on("moveend", function () {
          console.log('pan');
        });
        reset();

        function reset() {
          // console.log('reset');

          /*have to redraw everything as coordinates changes after zooming,
            cannot preserve existing path (inflow, outflow)*/
          chartGroup.selectAll('.circ').remove().transition()
            .duration(500);

          chartGroup.selectAll('.goingline').remove().transition()
            .duration(500);

          let bounds = path.bounds(json),
            topLeft = bounds[0],
            bottomRight = bounds[1];

          let zoomScale = (bottomRight[0] - topLeft[0]);
          console.log(zoomScale);



          svg.attr("width", 1.2 * (bottomRight[0] - topLeft[0]))
            .attr("height", 1.3 * (bottomRight[1] - topLeft[1]))
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

          chartGroup.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

          feature.attr("d", path);

          //Bind data to circles per GeoJSON feature/districts	
          chartGroup.selectAll("circle")
            .data(json.features)
            .enter().append("circle")
            .attr("cx", function (d) {
              let ctroid;
              ctroid = path.centroid(d)[0]; // get the centroid x
              return ctroid;
            })
            .attr("cy", function (d) {
              let ctroid;
              ctroid = path.centroid(d)[1]; // get the centroid y
              return ctroid;
            })
            .attr("r", function (d) {
              //radius of the circle is defined by the number of total net migration change

              /*total_move_in and totale_emm are columns from csv file
              got added to json features through :    
              json.features[j].properties[propt] = tempObj[propt];*/
              let diff = d.properties.total_move_in - d.properties.total_move_out;
              //gives a minmum r if net changes = 0
              if (Math.abs(diff) < 5) {
                return 3;
              } else {
                return circleSize(Math.sqrt(Math.abs(diff) / Math.PI));
              }

            })
            .attr("class", "circ")
            //attach district name to each circle
            .attr("id", function (d) {
              return d.abbrev;
            })
            .attr("fill", function (d) {
              /*fill the color based on -/+ net changes*/
              let diff = d.properties.total_move_in - d.properties.total_move_out;
              if (diff > 0) {
                return "#65a89d";
              } else {
                return "#a96a46";
              }

            })
            .attr("fill-opacity", "0.5")
            .attr("stroke", "#fff")
            .attr("stroke-weight", "0.5")

            // add event listener for mouse over
            .on("mouseenter", function (d) {
              //toolOver is the event handler
              return toolOver(d, this);
            })
            .on("mousemove", function (d) {

              let offsetTarget = $(this).parent().parent().parent().parent().parent();
              let offset = offsetTarget.offset();

              let mx = (event.pageX - offset.left);
              let my = (event.pageY - offset.top);

              //console.log(mx, my);

              // d3.event.clientX & Y give the updated coordinates after panning and zooming
              // if(my>d3.event.clientY) {
              return toolMove(mx, my, d);
            })
            .on("mouseleave", function (d) {
              return toolOut(d, this);
            })
            .on("click", function (d) {

              currentDist = d;
              $('#distDropdown span').text($(this).attr('id')+'-'+d.id);
              clicked(d);
              resetBtn();
            })
            .transition()
            .duration(1500);
        }
      });
    });
  }

  //default map
  updateMap("../assets/raw_data/sd_coming_2018.csv", "../assets/raw_data/sd_going_2018.csv");

  function toolOver(v, thepath) {
    d3.select(thepath)
      //in v4+ use the "long forms"
      .attr("fill-opacity", "0.7")
      .attr("cursor", "pointer");
    return tooltip.style("visibility", "visible");
  };

  function toolOut(m, thepath) {
    d3.select(thepath)
      .attr("fill-opacity", "0.5")
      .attr("cursor", "");
    return tooltip.style("visibility", "hidden");
  };


  function toolMove(mx, my, data) {
    if (mx < 40) {
      mx = 40
    };

    if (my < 40) {
      my = 40
    };

    // console.log(mx, my);

    //create the tooltip, style it and inject info
    return tooltip.style("top", my + "px")
      .style("left", mx + "px")
      .html("<div id='tipDiv'><div id='tipLoc'><b>" + data.id +
        "</b></div><div id='tipInfo'>Migration in: <b>" + formatC(data.properties.total_move_in) +
        "</b><br>Migration out: <b>" + formatC(data.properties.total_move_out) +
        "</b><br>Net migration: <b>" + formatC((data.properties.total_move_in - data.properties.total_move_out)) +
        "</b></div><div class='tipClear'></div> </div>");
  };


  //toolOver2 and ...2 are event handlers for paths btw two districts
  function toolOver2(v, thepath) {

    d3.select(thepath)
      //in v4+ use the "long forms", opacity for stroke, fill-opacity for shape bg
      .attr("opacity", "0.7")
      .attr("cursor", "pointer");
    return tooltip2.style("visibility", "visible");
  };

  function toolOut2(m, thepath) {
    d3.select(thepath)
      //in v4+ use the "long forms"
      .attr("opacity", "0.5")
      .attr("cursor", "");
    return tooltip2.style("visibility", "hidden");
  };

  function toolMove2(mx, my, home, end, v1, v2) {
    // let diff = v1 - v2;

    if (mx < 40) {
      mx = 40
    };

    if (my < 40) {
      my = 40
    };

    //create the tooltip for paths, style it and inject info
    return tooltip2.style("top", my + "px")
      .style("left", mx + "px")
      .html("<div id='tipDiv2'><div id='tipLoc2'><b>" + home +
        "/" + end + "</b></div><div id='tipInfo2'>" + home +
        " to " + end + ": <b>" + formatC(v2) + "</b><br>" + end +
        " to " + home + ": <b>" + formatC(v1) + "</b><br>Net change, " + home +
        ": <b>" + formatD(v1 - v2) + "</b></div><div class='tipClear'></div> </div>");
  };

  //function crates the path
  function clicked(selected, flowtype) {
    console.log(selected);
    //let coming = selected.properties;
    let selDist, distName;
    let homex, homey;

    // let selectedOpt = d3.select('#distDropdown').nodes()[0][0].label;

    /*
    if the selection is made by clicking we can access the following properties
    if the selection is done by dropdown, get attribute from dom element
    */
    if (selected.abbrev && selected.properties.SDNAME) {
      selDist = selected.abbrev;

      //sleDist is the SD number, distName is for displaying purpose
      distName = selected.properties.SDNAME;

      // geopath that creates target district map
      // defined in the begining 
      homex = path.centroid(selected)[0];
      homey = path.centroid(selected)[1];

    } else {
      //get sd abbrev from the id, 
      //here we dont have distName, will define later
      selDist = selected.getAttribute('id');


      //convert attribute string to number for use in the path('d',val)
      homex = +(selected.getAttribute('cx'));
      homey = +(selected.getAttribute('cy'));
    }
    console.log(selDist);

    /*
     d3.selectAll(".circ")
     .attr("fill-opacity", "0.2");
    */



    chartGroup.selectAll(".goingline")
      //dash css, 0 solid
      .attr("stroke-dasharray", 0)
      .remove()

    //for top 5 flow
    let flow_arr = [];

    goingData.forEach(function (d, i) {
      let finalval = comingData[i][selDist] - goingData[i][selDist];
      flow_arr.push(finalval);
    })

    let topFlow = flow_arr.sort(function (a, b) {
      return b - a;
    });

    let top_5_flow = topFlow.slice(0, 5);
    let bottom_5_flow = topFlow.slice(-5);

    chartGroup.selectAll(".goingline")
      //bind going data
      .data(goingData)
      .enter().append("path")
      .attr("class", "goingline")

      .attr("d", function (d, i) {
        // console.log(d); // it's all obejcts in goingData
        //data points here are from .csv, case sensitive!!!
        let abb = d.Abbrev;

        console.log(d);

        /*
        net changes btw going and coming
        the csv coming and going is based on column: e.g. going or coming number of students to the ditrict in title row 
        */
        let finalval = comingData[i][selDist] - goingData[i][selDist];
        /*
        select the district (destination, id has been assigned)
        the id here is the id of the circle of destination (circle)
        */

        let theDistrict = d3.select('#' + abb);

        //here we can extract the full name of home ditrict
        if (selDist == abb) {
          distName = theDistrict.nodes()[0].__data__.id;
        }

        /*
         selections are arrays of arrays of DOM elements. 
         The outer-most array is called a 'selection', 
         the inner array(s) are called 'groups' and those groups contain the DOM elements.
  
         In the normal version (https://d3js.org/d3.v4.js), the console.log return should be: 
         Selection {_groups: Array[1], _parents: Array[1]}
  
         !!!!!use nodes(): to get the inner array(s)!!!!!
         */

        //coordinates of the path destination
        let destx = path.centroid(theDistrict.nodes()[0].__data__)[0];
        let desty = path.centroid(theDistrict.nodes()[0].__data__)[1];

        if ($('#flat_switch').is(':checked')) {
          console.log('switch on');
          if (flowtype && flowtype == 'inflow') {
            if (!isNaN(finalval) && (finalval > 0) && (top_5_flow.includes(finalval))) {
              return "M" + destx + "," + desty + " Q" + Number((destx + homex)) / 2 + " " + (desty + homey) / 1.5 + " " + homex + " " + homey;
            }

          } else if (flowtype && flowtype == 'outflow') {
            if (!isNaN(finalval) && (finalval < 0) && (bottom_5_flow.includes(finalval))) {
              return "M" + homex + "," + homey + " Q" + (destx + homex) / 2 + " " + (desty + homey) / 2.5 + " " + destx + " " + desty;
            }
          } else {
            //validate and check the net changes, and exclude path with no migration change
            if (!isNaN(finalval) && (comingData[i][selDist] != 0 || goingData[i][selDist] != 0) && (top_5_flow.includes(finalval) || bottom_5_flow.includes(finalval))) {
              //extract the district name from the __data__ obejct
              console.log(theDistrict.nodes()[0].__data__.id);

              //if theres changes meanig movements btw home distric and dest district
              if (finalval > 0) {
                return "M" + destx + "," + desty + " Q" + Number((destx + homex)) / 2 + " " + (desty + homey) / 1.5 + " " + homex + " " + homey;
              } else if (finalval < 0) {
                return "M" + homex + "," + homey + " Q" + (destx + homex) / 2 + " " + (desty + homey) / 2.5 + " " + destx + " " + desty;
              }
            }
          }

        } else {
          if (flowtype && flowtype == 'inflow') {
            if (!isNaN(finalval) && (finalval > 0) && (top_5_flow)) {
              return "M" + destx + "," + desty + " Q" + Number((destx + homex)) / 2 + " " + (desty + homey) / 1.5 + " " + homex + " " + homey;
            }

          } else if (flowtype && flowtype == 'outflow') {
            if (!isNaN(finalval) && (finalval < 0)) {
              return "M" + homex + "," + homey + " Q" + (destx + homex) / 2 + " " + (desty + homey) / 2.5 + " " + destx + " " + desty;
            }
          } else {
            //validate and check the net changes, and exclude path with no migration change
            if (!isNaN(finalval) && (comingData[i][selDist] != 0 || goingData[i][selDist] != 0)) {
              //extract the district name from the __data__ obejct
              console.log(theDistrict.nodes()[0].__data__.id);

              //if theres changes meanig movements btw home distric and dest district
              if (finalval > 0) {
                return "M" + destx + "," + desty + " Q" + Number((destx + homex)) / 2 + " " + (desty + homey) / 1.5 + " " + homex + " " + homey;
              } else if (finalval < 0) {
                return "M" + homex + "," + homey + " Q" + (destx + homex) / 2 + " " + (desty + homey) / 2.5 + " " + destx + " " + desty;
              }
            }
          }
        }
      })

      //the drawing annimation
      .call(transition)

      //determine the stroke width based on net changes

      //prob:stroke-width is fixed at 0.5?????
      .attr("stroke-width", function (d, i) {

        let finalval = comingData[i][selDist] - goingData[i][selDist];

        return lineSize(parseFloat(Math.abs(finalval)));

      })
      //stroke color
      .attr("stroke", function (d, i) {
        let finalval = comingData[i][selDist] - goingData[i][selDist];
        if (finalval > 0) {
          //color for positive growth
          return "#65a89d";
        } else {
          return "#a96a46";
        }

      })
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .attr("stroke-linecap", "round")
      .on("mouseenter", function (d) {
        console.log('mouse over');
        return toolOver2(d, this);
      })
      .on("mousemove", function (d, i) {
        let offsetTarget = $(this).parent().parent().parent().parent().parent();
        let offset = offsetTarget.offset();

        let mx = (event.pageX - offset.left);
        let my = (event.pageY - offset.top);
        return toolMove2(mx, my, distName, d.District, comingData[i][selDist], goingData[i][selDist]);

      })
      .on("mouseleave", function (d) {
        return toolOut2(d, this);
      });
  }

  //must append elements or bind data before a transition starts.
  //use the attrTween and transform to navigate along the path
  function transition(path) {
    path.transition()
      .duration(2000)
      .attrTween("stroke-dasharray", tweenDash);
  }

  function tweenDash() {
    let l = this.getTotalLength(),
      i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) {
      return i(t);
    };
  }

  //clear flow selection
  function resetBtn() {
    let flowBtns = d3.selectAll('.flowBtn');
    flowBtns.attr('class', 'flowBtn');
    let defBtn = d3.select('#btn_all');
    defBtn.classed('selected', true);;
    currentFlowType='all';
  }

  /*control panel*/

  //dropdown selection
  $('#yearDropdown').on('click', function() {
    $('.dropDown').not(this).removeClass('active');
    $(this).toggleClass('active');
    //swap database when select changes
    d3.selectAll('#yearDropdown .list div')
      .on('click', function () {
        //jquery, this is so bad... :(
        $('#yearDropdown span').text($(this).text());
        $('#yearDropdown').attr('attr', 'dropDown');
        let newData = d3.select(this).attr('data-value');
        //clear dropdown array
        // sd_list_arr=[];
        updateMap("../assets/raw_data/sd_coming_" + newData + ".csv", "../assets/raw_data/sd_going_" + newData + ".csv");
        resetBtn();
      });
  });


  //dropdown select district
  $('#distDropdown').on('click', function() {
    $('.dropDown').not(this).removeClass('active');
    $(this).toggleClass('active');
    $('#yearDropdown').removeClass('active');

    //or add click listener when appending the divs
    d3.selectAll('#distDropdown .list div')
      .on('click', function () {
        $('#distDropdown span').text($(this).text());
        $('#distDropdown').attr('attr', 'dropDown');
        let targetSd = eval(d3.select(this).attr('data-value'));
        console.log(targetSd);
        currentDist = targetSd;
        //console.log(currentDist);
        clicked(targetSd);
        resetBtn();
      });
  });

  //toggle migration flow
  let selectedFlow = 'all';
  let flowBtns = d3.selectAll('.flowBtn');
  flowBtns.on('click', function () {
    console.log(currentDist);
    flowBtns.attr('class', 'flowBtn'); // this gets called everytime when a new click happens
    this.classList.add('selected'); //this can only apply vanllila js code

    currentFlowType = this.getAttribute('value');
    // console.log(btnFlowType);

    // let currentLines = chartGroup.selectAll('.goingline');
    // console.log(currentLines);

    // // currentLines.remove();

    //let strokeColor = currentLines.nodes()[i].attributes.stroke.nodeValue;
    if (currentFlowType) {
      clicked(currentDist, currentFlowType);
    } else if (currentFlowType == 'all') {
      clicked(currentDist);
    }

  });

  //top 5 swtich
  //.checked doesn't work on jquery object, use either way to 
  $('#flat_switch').change(function () {
    // console.log(document.querySelector('#flat_switch').checked);
    // console.log($('#flat_switch').is(':checked'));
    if (currentFlowType) {
      clicked(currentDist, currentFlowType);
    } else if (currentFlowType == 'all') {
      clicked(currentDist);
    }
  });


});
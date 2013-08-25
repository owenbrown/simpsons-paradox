app.directive('lineChart', function(){

  var margin = { top: 20, right: 10, bottom: 40, left: 40 }
    , width = 380 - margin.left - margin.right
    , height = 300 - margin.top - margin.bottom
    //flatui colors
    , blue = '#3498DB'
    , black = '#2C3E50'
    , red = '#E74C3C'

    , x = d3.scale.linear()
      .domain([0,100])
      .range([0, width])

    , y = d3.scale.linear()
      .domain([0,100])
      .range([height, 0])

    , xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")

    , yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

    , line = d3.svg.line()
      .x(function(d) { return x(d.x) })
      .y(function(d) { return y(d.y) })

  // Runs during compile
  return {
    restrict: 'A' // E = Element, A = Attribute, C = Class, M = Comment
    , link: function(scope, elem, attrs) {
      var rates = scope.rates
        , proportions = scope.proportions

      d3.select(elem[0]).select("svg").remove()

      var svg = d3.select(elem[0]).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class","svg-line")
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      var gYAxis = svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)

      gYAxis.append("text")
        .attr("transform", " translate(" + (-28) + "," + (height / 2) + ") rotate(-90)")
        .style("text-anchor", "middle")
        .attr("font-size","18px")
        .text("percent admitted")

      var gXAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)

      gXAxis.append("text")
        .attr("transform", " translate(" + (width / 2) + "," + (35) +  ")")
        .style("text-anchor", "middle")
        .attr("font-size","18px")
        .text('percent easy dept')
        .classed('x-axis-label')

      // women line
      svg.append("path")
        .datum([
          { x: 0, y: rates.female.hard * 100 }
          , { x: 100, y: rates.female.easy * 100 }
        ])
        .attr("class", "line")
        .attr("d", line)
        .attr("stroke",red)
        .attr("stroke-width","1.5px")

      // women ball
      svg.append("g")
        .attr("class","g-red-circles")
        .selectAll("red circles")
        .data([proportions.easy])
        .enter()
        .append("circle")
        .attr({
          class: "red-circles",
          r: 6,
          cx: function(d, i){ return x(d.female) }
          , cy: function(d, i){ return y(d.female) }
          , fill: red
          , stroke: '#2C3E50'
        })

      // men line
      svg.append("path")
        .datum([
          { x: 0, y: rates.male.hard * 100 }
          , { x: 100, y: rates.male.easy * 100 }
        ])
        .attr("class", "line")
        .attr("d", line)
        .attr("stroke", blue)
        .attr("stroke-width", "1.5px")

      // men ball
      svg.append("g")
        .attr("class","g-blue-circles")
        .selectAll("blue circles")
        .data([proportions.easy])
        .enter()
        .append('circle')
        .attr({
          'class': 'blue-circles'
          , r: 6
          , cx: function(d, i){ return x(d.male) }
          , cy: function(d, i){ return y(d.male) }
          , fill: blue
          , stroke: '#2C3E50'
        })

      scope.$watch("proportions.easy.female + proportions.easy.male", function (val){
        var proportions = scope.proportions
          , svg = d3.select(elem[0])
          , admitted, applied
          , depts = scope.departments

        // women
        admitted = depts.easy.female.admitted + depts.hard.female.admitted
        applied = depts.easy.female.applied + depts.hard.female.applied
        svg.select(".red-circles")
          .data([{
            x: proportions.easy.female * 100
            , y: (admitted / applied) * 100
          }])
          .attr({
            cx: function(d){ return x(d.x) }
            , cy: function(d){ return y(d.y) }
          })

        // men
        admitted = depts.easy.male.admitted + depts.hard.male.admitted
        applied = depts.easy.male.applied + depts.hard.male.applied
        svg.select(".blue-circles")
          .data([{
            x: proportions.easy.male * 100
            , y: (admitted / applied) * 100
          }])
          .attr({
            cx: function(d){ return x(d.x) }
            , cy: function(d){ return y(d.y) }
          })
      })
    }
  }
})
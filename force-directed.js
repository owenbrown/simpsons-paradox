var blue = '#3498DB',
 red = '#E74C3C',
 black = '#2C3E50'
var margin = {top: 20, right: 10, bottom: 40, left: 40}

var w = window.innerWidth*.6
  , h = 350
  , tempo = 500
  , data = {
    'Women' : {
      'A' : [9, 11]
      , 'B' : [2, 3]
      , 'C' : [20, 59]
      , 'D' : [13, 38]
      , 'E' : [9, 39]
      , 'F' : [2, 34]
    }
    , 'Men' : {
      'A' : [51, 82]
      , 'B' : [35, 56]
      , 'C' : [12, 33]
      , 'D' : [14, 42]
      , 'E' : [5, 19]
      , 'F' : [2, 27]
    }
  }
  // return the combined ration for a row in the data
  , combined = function(row){
    return _.reduce(_.toArray(data)[row], function(m, n){
      return _.zip(m, n).map(function(a){ return a[0] + a[1] })
    }, [0, 0])
  }
  , rows = _.keys(data)
  , cols = _.keys(_.first(_.toArray(data)))
  // max for each column
  , col_maxs = (function(){
      var maxs = _.map(cols, function(col){
        var max_row = 0
        _.reduce(_.toArray(data), function(max, row, row_ind){
          var t = row[col][0] / row[col][1]
          if(t > max){
            max_row = row_ind
            max = t
          }
          return max
        }, 0)
        return max_row
      })
      var max_combined_index = -1
      var max_combined = _.reduce(rows, function(max, row, i){
        var t = combined(i)
        t = t[0] / t[1]
        if(t > max){
          max_combined_index = i
          max = t
        }
        return max
      }, 0)
      maxs.push(max_combined_index)
      return maxs
    })()
  , num_nodes = _.chain(data).map(function(row){
    return _.map(row, function(col){
      return _.last(col)
    }).reduce(function(m, n){ return m + n })
  }).reduce(function(m, n){ return m + n}, 0).value()
  , max_nodes_per_ratio = d3.max(_.map(data, function(row){
    return d3.max( _.map(row, function(col){ return _.last(col) } ) )
  }))
  , fill = function(d){
    if(d) return red
    else return blue
  }
  , svg = d3.select('.vis svg')
      .attr('width', w  + margin.left + margin.right)
      .attr('height', h + margin.top + margin.bottom)
  , main = svg.append("g")
    .attr("class", "main")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")")
  , createForce = function(){
    return d3.layout.force()
      .nodes([])
      .links([])
      .gravity(0)
      .size([w, h])
      .linkDistance(0)
      .linkStrength(2)
      .friction(0.2)
      .charge(function(d, i){ return d.charge })
  }
  , forces = _.map(rows, createForce)
  , linkToFoci = function(links, nodes, foci){
    // a node can only be linked to a single foci
    _.each(nodes, function(node){
      for(var i = 0; i < links.length; i++){
        if(links[i].source === node){
          links.splice(i, 1)
          break
        }
      }
    })
    return nodes.map(function(node){
      links.push({ source : node, target : foci })
    })
  }
  , createNodes = function(num, denom, name){
    return d3.range(denom).map(function(d){
      return {
        id : d < num ? 0 : 1
        , x : d < num ? 0 : w
        , y : Math.random() * h
        , charge : -1 * 10000 / max_nodes_per_ratio
        , name : name + ((d < num) ? ' num' : ' denom')
      }
    })
  }
  , createFoci = function(x, y, name){
    return { x : x, y : y, charge : 0, fixed : true, name : name }
  }
  , focis = {}
  , rowClass = function(row){
    return 'row-' + row.replace(/ /g, '').toLowerCase()
  }
  , colClass = function(col){
    return 'col-' + col.replace(/ /g, '').toLowerCase()
  }
  , x = d3.scale.ordinal()
    .domain(cols.concat('combined'))
    .rangeRoundBands([margin.left, w + margin.left + margin.right], .1)

  , y = d3.scale.ordinal()
    .domain(rows)
    .rangeRoundBands([margin.top, h + margin.bottom + margin.top], .1)

// create all the focal points for the different nodes
_.each(rows, function(row_val, row){
  _.each(cols, function(col_val, col){
    var row_class = rowClass(rows[row])
      , col_class = colClass(cols[col])
      , x = (w + margin.left + margin.right) / (cols.length + 2) * (col + 1)
      , y = (h + margin.top + margin.bottom) / (rows.length + 1) * ( row + 1)
      , foci1 = createFoci( x,  y, row_class + ' ' + col_class + ' foci foci-0')
      , foci2 = createFoci( x,  y, row_class + ' ' + col_class + ' foci foci-1')
    if(!focis[rows[row]]) focis[rows[row]] = {}
    focis[rows[row]][cols[col]] = [foci1, foci2]
    forces[row].nodes().push(foci1, foci2)
  })
})

function setupNodeAndLinks(force, row){
  cols.forEach(function(col){
    var fociSet = focis[row][col]
      , num = data[row][col][0]
      , den = data[row][col][1]
      , row_class = rowClass(row)
      , col_class = colClass(col)
      , nodes = createNodes(num, den, row_class + ' ' + col_class)
    force.nodes().push.apply(force.nodes(), nodes)
    linkToFoci(force.links(), nodes.filter(function(d){
      return d.id === 0
    }), fociSet[0] )
    linkToFoci(force.links(), nodes.filter(function(d){
      return d.id === 1
    }), fociSet[1] )
  })
}

_.each(forces, function(force, i){
  setupNodeAndLinks(force, rows[i] )
  // force.alpha(1)
  force.on('tick', function(e){
    main.selectAll('circle.' + rowClass(rows[i]))
      .attr('cx', function(d) { return d.x })
      .attr('cy', function(d) { return d.y })
  })
})



main.selectAll('circle' + '.node')
  .data(_.reduce(forces
    , function(nodes, force) { return nodes.concat(force.nodes()); }, []))
  .enter().append('circle')
    .attr('class', function(d){ return 'node ' + d.name})
    .attr('cx', function(d) { return d.x })
    .attr('cy', function(d) { return d.y })
    .attr('r', 3 + 100 / num_nodes )
    .style('fill', function(d) { return fill(d.id) })
    .style('stroke', 'white')
    .style('stroke-width', 1)

_.each(forces, function(force){ force.start() })

/**
  * cl(row, col, [fociId])
  * generate a class selector for the given row, col and optional fociId
  */
var cl = function(row, col, fociId){
    fociId = (fociId !== null && fociId !== undefined) ? '.foci-' + fociId : ''
    col = (col !== null && col !== undefined) ? '.' + colClass(cols[col]) : ''
    row = (row !== null && row !== undefined) ? '.' + rowClass(rows[row]) : ''
    return row + col + fociId
  }
  , selectNodes = function(selector){
    var res = []
    main.selectAll(selector).each(function(d){
      if(!d instanceof Object){
        debugger
      }
      res.push(d)
    })
    return res
  }
  , ratioLabelPos = function(row, col){
    var maxr = 0
      , cx = Number(d3.select(cl(row, col, 0)).attr('cx'))
      , cy = Number(d3.select(cl(row, col, 0)).attr('cy'))
    d3.selectAll('.node' + cl(row, col)).each(function(d){
      var r = Math.sqrt( (d.x - cx) * (d.x - cx) + (d.y - cy) * (d.y - cy))
      maxr = r > maxr ? r : maxr
    })
    return {
      x : cx + Math.cos(45) * maxr
      , y : cy - Math.sin(45) * maxr
    }
  }
  , ratioLabelFormat = function(d){ 
    return d3.format('.0%')(d[0] / d[1]) 
  }
  
  , timeline = [
    tempo * 2
    , function(){
      // show labels
      var labels = []
      for(row in rows){
        for(col in cols){
          labels.push({
            foci: cl(row, col)
            , text : ratioLabelFormat(data[rows[row]][cols[col]])
            , row : Number(row)
            , col : Number(col)
          })
        }
      }
      var ratios = main.selectAll('text.year-ratio')
      ratios.remove()
      ratios.data(labels)
        .enter().append('text')
          .attr({
            class : 'year-ratio'
            , x : function(d){  
              return ratioLabelPos(d.row, d.col).x
            }
            , y : function(d){ 
              return ratioLabelPos(d.row, d.col).y
            }
          })
          .text(function(d){ return d.text })
          .style('opacity','0.0')
          .transition()
          .style('opacity','1.0')
          .style('font-weight', function(d){
            return col_maxs[d.col] === d.row ? 'bold' : 'normal'
          })
    }
    , tempo * 5
    , function(){
      var dur = 250
      var ratios = main.selectAll('text.year-ratio')
        .transition()
        .duration(dur)
        .style('opacity','0.0')
        .remove()
      return dur
    }
    , function(){
      var dur = tempo * 1
      for(var row in rows){
        // a hack to make the combined edges a bit smoother
        animFoci( cl(row) + '.foci-0', { x : x('combined') - 100 }, dur)
        animFoci( cl(row) + '.foci-1', { x : x('combined') }, dur)
      }
      return dur
    }
    // this is a bit of a hack to get the groups of nodes to combine
    // properly. all we're doing is re-arranging the the links and foci
    // so that there are only two groups of nodes and foci.
    // for more about this, see: 
    , function(){
      var dur = 1, nodes, numerators, denominators, foci
      for(var row in rows){
          numerators = '.' + rowClass(rows[row]) + '.node.num'
          nodes = selectNodes(numerators)
          foci = selectNodes( cl(row, null, 0))[0]
          linkToFoci(forces[row].links(), nodes, foci)
          denominators = '.' + rowClass(rows[row]) + '.node.denom'
          nodes = selectNodes(denominators)
          foci = selectNodes( cl(row, null, 1))[0]
          linkToFoci(forces[row].links(), nodes, foci)
      }
      return dur
    }
    , function(){
      var dur = tempo * 2
      for(var row in rows){
        for(var col in cols){
          animFoci( cl(row, col) + '.foci-0', { x : w / (cols.length + 2) * (cols.length + 1) }, dur)
          animFoci( cl(row, col) + '.foci-1', { x : w / (cols.length + 2) * (cols.length + 1) }, dur)
        }
      }
      return dur
    }
    , tempo * 1
    // show the combined ratios
    , function(){
      var labels = rows.map(function(row, i){
        return {
          text : ratioLabelFormat(combined(i))
          , row : i
          , col : cols.length
          , foci: cl(i, 0)
        }
      })
      var ratios = main.selectAll('text.combined-ratio')
      ratios.remove()
      ratios.data(labels)
        .enter().append('text')
          .attr({
            class : 'combined-ratio'
            , x : function(d){  
              return ratioLabelPos(d.row, 0).x
            }
            , y : function(d){ 
              return ratioLabelPos(d.row, 0).y
            }
          })
          .text(function(d){ return d.text })
          .style('opacity','0.0')
          .transition()
          .style('opacity','1.0')
          .style('font-weight', function(d){
            return col_maxs[d.col] === d.row ? 'bold' : 'normal'
          })
    }
    , tempo * 5
    // hide the combined ration labels
    , function(){
      var dur = 250
      var ratios = main.selectAll('text.combined-ratio')
        .transition()
        .duration(dur)
        .style('opacity','0.0')
        .remove()
      return dur
    }
    , function(){
      // undo hack from above
      var dur = 1, nodes, numerator, denominator, foci
      for(var row in rows){
        for(var col in cols){
          numerator = cl(row, col) + '.num'
          nodes = selectNodes(numerator)
          foci = selectNodes( cl(row, col, 0))[0]
          linkToFoci(forces[row].links(), nodes, foci)

          numerator = cl(row, col) + '.denom'
          nodes = selectNodes(numerator)
          foci = selectNodes( cl(row, col, 1))[0]
          linkToFoci(forces[row].links(), nodes, foci)
        }
      }
      return dur
    }
    // back to the original configuration
    , function(){
      var dur = tempo
      _.each(rows, function(row_val, row){
        _.each(cols, function(col_val, col){
          animFoci( cl(row, col) + '.foci-0', { x : x('combined') - 200 }, dur)
          animFoci( cl(row, col) + '.foci-1', { x : x('combined') + 20 }, dur)
        })
      })
      return dur
    }
    , function(){
      var dur = tempo
      _.each(rows, function(row_val, row){
        _.each(cols, function(col_val, col){
          animFoci( cl(row, col) + '.foci-0', { x : x(cols[col]) }, dur)
          animFoci( cl(row, col) + '.foci-1', { x : x(cols[col]) }, dur)
        })
      })
      return dur
    }
  ]
  // loop through the timeline
  , t = -1
  , forward = 1
  , back_and_forth = false // change to play the animation `back-and-forth`
  , is_playing = true
  , loop = function(){
    if(is_playing){
      if(back_and_forth){
        if(t >= timeline.length - 1) forward = -1
        else if (t <= 0) forward = 1
      }
      var now = timeline[t = (t + forward) % timeline.length]
      if(typeof now === 'function'){
        var dur = now()
        if(dur === undefined) dur = tempo
        setTimeout(loop, dur)
      }else setTimeout(loop, now)
    }else setTimeout(loop, 100)
  }

loop()

function animFoci(foci, pos, duration){
  if(duration === undefined) duration = 1000
  d3.selectAll(foci + '.foci')
    .transition()
    .duration(duration)
    .ease('cubic-in-out')
    .tween('dataTween', function(d){
      if(!pos.x) pos.x = d.px
      if(!pos.y) pos.y = d.py
      var ix = d3.interpolate(d.x, pos.x)
      var iy = d3.interpolate(d.y, pos.y)
      return function(t){
        d.x = d.px = ix(t)
        d.y = d.py = iy(t)
      }
    })
  _.each(forces, function(force){
    force.start()
  })
}

// Labels

// todo: change root `em` size depending on window size
// d3.select('body').style('font-size', '1em')

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("right"); 

var gXAxis = svg.append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")" )
    .attr("class", "x-axis-force")
    .call(xAxis)

var gYAxis = svg.append("g")
    .attr("class", "y-axis-force")
    .call(yAxis)

svg.append('text')
  .text('1 ball = 10 applicants ')
  .attr({
    x : 10
    , y : h + margin.top
    , class : 'legend-item1'
  })

var playButton = document.getElementsByClassName('play-button')[0]
playButton.onclick = function(e){
  e.preventDefault()
  is_playing = !is_playing
  playButton.innerText = is_playing ? 'stop' : 'play'
}

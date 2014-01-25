var numClusters = 3,
    clusterNames = {},
	w = 960,
	h = 400,
	margin = 50,
	startDate = 1, 
	endDate = 400,
	minExpression = 0,
	maxExpression = 1000,
	y = d3.scale.linear().domain([maxExpression, minExpression]).range([0 + margin, h - margin]),
	x = d3.scale.linear().domain([startDate, endDate]).range([0 + margin, w - margin]),
	timepoints = [1.0,4.0,21.0,116.0,185.0,186.0,255.0,289.0,290.0,292.0,294.0,297.0,301.0,307.0,311.0,322.0,329.0,369.0,380.0,400],
    maxAverageExpression = 0,
    normalize=false;

var xAxis = d3.svg.axis().scale(x).tickSize(0).tickSubdivide(true),
    yAxis = d3.svg.axis().scale(y).ticks(4).orient("left");
var geneCluster;
var currentDendrogram;
var nodes;

var color = d3.scale.category20();
var fill = d3.scale.category20();

var sheet = document.styleSheets[0];
for (var i = 0; i < numClusters; i++) {
    clusterNames['Cluster_' + i] = 'C' + i;
    d3.select("#filters")
        .append('a')
        .attr('id', 'C' + i)
        .html(i);
    sheet.addRule("#filters a.C" + i, "background: " + color(i) + "; color: #fff;", 1);
    sheet.addRule(".C" + i+".highlight", "stroke: " + color(i) + ";", 1);
    sheet.addRule(".C" + i+".highlight .average", "stroke: black;", 1);
}

var vis = d3.select("#vis")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g");
			
var line = d3.svg.line()
    .x(function(d,i) { return x(d.x); })
    .y(function(d) { return y(d.y); });
					
var genes_clusters = {}; // cluster1 : [path1, path2] ;
//currentclusters = cluster1 : [path1,path2], cluster2:...
// data = currentclusters.toarray
var allClusters = {};
var currentClusters = {};
var averages = {};
var geneDescriptions = {};
var maxExpressions = {};
getGeneDescriptions();
for (var k = 0; k < numClusters; k++) {
    getCluster(k);
}
var data = [];

// Add the x-axis.
vis.append("svg:g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + parseInt(h - margin)+ ")")
  .call(xAxis);

// Add the y-axis.
vis.append("svg:g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + margin + ", 0)")
  .call(yAxis);

/* Dendrogram */

var radius = 960 / 2;
var height = radius * 2 + 200;
var width = radius * 2 + 200;

var cluster = d3.layout.cluster()
    .size([360, radius - 250]);

var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

var svg = d3.select("#cluster-info")
.append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

d3.json("/data/geneCluster.json", function(error, root) {
  geneCluster = root;
  currentDendrogram = geneCluster;
  nodes = cluster.nodes(currentDendrogram);


});

d3.select(self.frameElement).style("height", radius * 2 + "px");

/* Word Cloud */

var words = [],
    max,
    scale = 1,
    complete = 0,
    keyword = "",
    tags,
    fontSize,
    maxLength = 30,
    fetcher = "http://www.jasondavies.com/wordtree/cat-in-the-hat.txt",
    statusText = d3.select("#status");

var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/,
    punctuation = /[!"&()*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g,
    wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g,
    discard = /^(@|https?:)/,
    htmlTags = /(<[^>]*?>|<script.*?<\/script>|<style.*?<\/style>|<head.*?><\/head>)/g,
    matchTwitter = /^https?:\/\/([^\.]*\.)?twitter\.com/;

var layout = d3.layout.cloud()
    .timeInterval(10)
    .size([w, h])
    .fontSize(function(d) { return fontSize(+d.value); })
    .text(function(d) { return d.key; })
    .on("word", progress)
    .on("end", draw);

var cloudsvg = d3.select("#wordcloud").append("svg")
    .attr("width", w)
    .attr("height", h);

var background = cloudsvg.append("g"),
    wordcloud = cloudsvg.append("g")
    .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");

/* helper functions */

function onclick(d, i) {
    var currClass = d3.select(this).attr("class");
    if (d3.select(this).classed('selected')) {
        d3.select(this).attr("class", currClass.substring(0, currClass.length-9));
        
    } else {
        d3.select(this).classed('selected', true);
        
    }
}

function onmouseover(d, i) {
    var currClass = d3.select(this).attr("class");
    d3.select(this)
        .attr("class", currClass + " current");
    
    var geneName = $(this).attr("name").split(":")[0];
    var geneDescription = '';
    if (geneName in geneDescriptions) {
        geneDescription = geneDescriptions[geneName];
    }
    var blurb = '<h2>' + geneName + '</h2>';
    blurb += '<p>' + geneDescription + '</p>'    
    $("#default-blurb").hide();
    $("#blurb-content").html(blurb);
}

function onmouseout(d, i) {
    var currClass = d3.select(this).attr("class");
    var prevClass = currClass.substring(0, currClass.length-8);
    d3.select(this)
        .attr("class", prevClass);
    $("#default-blurb").show();
    $("#blurb-content").html('');
}

function showCluster(clusterCode) {
    var genes = d3.selectAll("path."+clusterCode);
    updateClusters(clusterCode);
    updateDendrogram();
    redraw();
    redrawDendrogram();
    redrawWordcloud();
}

function getCluster(num) {
    d3.text('/data/Cluster_' + num + '.csv', 'text/csv', function(text) {
    var clusterName = 'C' + num;
    allClusters[clusterName] = new Array();
    var genes = d3.csv.parseRows(text);
    var average = new Array(20);
    //var allSignals = [];
    for (var a = 0; a < 20; a++) {
        average[a] = 0;
    }
    for (i=1; i < genes.length; i++) {
        var values = genes[i].slice(1, genes[i.length-1]);
        var currData = [];
        var currMaxExpression = 0;
        genes_clusters[genes[i][0]] = clusterName;
        var normCurrData = [];
        var normalizedExpression = [];

        for (j=0; j < values.length; j++) {
            if (values[j] != '') {
                currData.push({ x: timepoints[j], y: parseFloat(values[j]) });  
                //average[j] += parseFloat(values[j])/genes.length;
                currMaxExpression = Math.max(currMaxExpression,parseFloat(values[j]));
                //allSignals.push(toString(values));
            }
        }
        for (j=0; j < values.length; j++) {
            if (values[j] != '') {
                average[j] += parseFloat(values[j])/currMaxExpression/genes.length;
                normalizedExpression.push({x: timepoints[j], y: parseFloat(values[j])/currMaxExpression});
            }
        }
        maxExpressions[genes[i][0]] = currMaxExpression;
        allClusters[clusterName].push([genes[i][0], currData, clusterName, normalizedExpression])
    }
    var currMaxExpression = 0;
    //average = getAverageSignal(allSignals);
    for (l = 0; l< average.length; l++) {
        average[l] = {x: timepoints[l], y: average[l]};
        currMaxExpression = Math.max(average[l].y, currMaxExpression);
        //average[l] = {x: timepoints[l], y: average[l]};
        //currMaxExpression = Math.max(average[l].y, currMaxExpression);
    }
    maxAverageExpression = Math.max(maxAverageExpression, currMaxExpression);
    maxExpressions[clusterName + " average"] = currMaxExpression;
    averages[clusterName + " average"] = average;
    updateData();
    redraw();
}); 
}

function getGeneDescriptions() {
    d3.text('/data/geneDescriptions.txt', 'text/csv', function(text) {
        var genes = d3.csv.parseRows(text);
        for (i=1; i < genes.length; i++) {
            geneDescriptions[genes[i][0]] = genes[i][1];
        }
    });  
}

function updateClusters(clusterCode) {
    if (clusterCode in currentClusters) {
        delete currentClusters[clusterCode];
    } else {
        currentClusters[clusterCode] = allClusters[clusterCode];
    }

    updateData();
}

function updateData() {
    data = [];
    var maxValue = 0;


    for (c in currentClusters) {
        for (p in currentClusters[c]) {
            var pathinfo = currentClusters[c][p];
            if (normalize) {
                data.push({pathname:pathinfo[0], pathdata: pathinfo[3],clustername:pathinfo[2]});
                maxValue = 1;
            } else {
                data.push({pathname:pathinfo[0], pathdata: pathinfo[1],clustername:pathinfo[2]});
                maxValue = Math.max(maxValue, maxExpressions[pathinfo[0]]);
            }
            
        }
        var name = "";
        console.log(c);
        if (c==="C0") {
            name="Weight";
        }
        if (c==="C1") {
            name="Glucose";
        }
        if (c==="C2") {
            name="Calories burned";
        }
        console.log(c);
        data.push({pathname:name, pathdata: averages[c + " average"], clustername:c + " average"});
    }
    if (maxValue === 0) {
        maxExpression = maxAverageExpression;
        for (average in averages) {
            var name="";
            if (average==="C0 average") {
                name="Weight";
            }
            if (average==="C1 average") {
                name="Glucose";
            }
            if (average==="C2 average") {
                name="Calories burned";
            }
            data.push({pathname:name, pathdata: averages[average], clustername:average});
        }
    } else {
        maxExpression = maxValue;

    }
}

function redraw() {

    y.domain([maxExpression, minExpression]);
    vis.transition().duration(1000).select(".y.axis").call(yAxis);

    var paths = vis.selectAll("path")
        .data(data, function(d) { return d.pathname; });
    paths.enter().insert("svg:path", "g")
        .attr("name", function(d) { return d.pathname; })
        .attr("class", function(d) { return d.clustername.concat(" highlight"); })
        .attr("d", function(d) { return line(d.pathdata); })
        .on("mouseover", onmouseover)
        .on("mouseout", onmouseout);

    paths.transition().duration(1000)
        .attr("d", function(d) { return line(d.pathdata); })

    paths.exit().remove();
 
}

function changeNormalized() {
    normalize = !normalize;
    if (normalize) {
        $("#normalizebutton").text("Denormalize");
    } else {
        $("#normalizebutton").text("Normalize");
    }
    updateData();
    redraw();
}
/*
function normalizeData() {
    for (i in data) {
        var pathMax = maxExpressions[data[i].pathname];
        if (data[i].pathname.split(" ").length !=2) {
            for (j in data[i].pathdata) {
                data[i].pathdata[j].y = data[i].pathdata[j].y/pathMax;
            }
        }
    }
    maxExpression = 1;
}*/

function updateDendrogram() {
    var text = ''
    var newObject = {name: "Gene Clusters"};
    var children = [];
    for (i in geneCluster.children) {
        var tempcluster = geneCluster.children[i];
        if (clusterNames[tempcluster.name] in currentClusters) {
            children.push(tempcluster);
            for (j in tempcluster.children) {
                var group = tempcluster.children[j];
                for (k in group.children) {
                    var gene = group.children[k];
                    text += gene.description + ","
                    words.concat(gene.description.split(" "));
                }
            }
        }
    }
    newObject["children"] = children;
    currentDendrogram = newObject;
    parseText(text);
    

}

function redrawDendrogram() {

    nodes = cluster.nodes(currentDendrogram);
    var link = svg.selectAll("path.link")
      .data(cluster.links(nodes));
    link.enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal);

    link.transition().duration(1000)
        .attr("d", diagonal);

    link.exit().remove();

    var node = svg.selectAll("g.node")
        .data(nodes);

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

    nodeEnter.append("circle")
        .attr("r", 4.5);

    nodeEnter.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function(d) {
            if (d.type == "gene") {
                return d.name + " ("+d.description+")";
            } else if (d.type == "group") {
                return parseFloat(d.score).toFixed(2);
            } else {
                return d.name;
            }
            
        });

    var nodeUpdate = node.transition().duration(1000).attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    nodeUpdate.select("text").attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("dy", ".31em")
        .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function(d) {
            if (d.type == "gene") {
                return d.name + " ("+d.description+")";
            } else if (d.type == "group") {
                return parseFloat(d.score).toFixed(2);
            } else {
                return d.name;
            }
            
        });

    node.exit().remove();
}


function redrawWordcloud() {
    var text = d3.select("#wordcloud").append("svg")
        .attr("width", 300)
        .attr("height", 300)
      .append("g")
        .attr("transform", "translate(150,150)")
      .selectAll("text")
        .data(words);

    text.enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return color(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });

    text.transition().duration(1000)
        .style("font-size", function(d) { return d.size + "px"; })
        .style("fill", function(d, i) { return color(i); })
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });

    text.exit().remove();
}

/* Utility functions */

function makecopy(obj) {
    return jQuery.extend(true, {}, obj);
}

function makeArrayCopy(array) {
    var newArray = new Array(array.length);
    for (var i=0; i< newArray.length; i++) {
        newArray[i] = makecopy(array[i]);
    }
    return newArray;
}

/* Functions for calculating R, S, D curves */

var thresholdPercent = 0.1

function toString(signal){
    floatSignal = toFloat(signal);
    thresholdValue = getThresholdValue(floatSignal);
    charArray = new Array(signal.length);
    charArray[0] = 'S';
    for (var i=1; i< signal.length; i++) {
        charArray[i] = getChar((floatSignal[i] - floatSignal[i-1]),thresholdValue);
    }
    return charArray;
}

function toFloat(signal){
    var floatArray = new Array(signal.length);
    for (var i=0; i< signal.length; i++) {
        floatArray[i] = parseFloat(signal[i]);
    }

    return floatArray;
}

function getChar(delta,threshold) {
    if (delta >= threshold) {
        return 'R'; // rise
    }       
    else if (delta <= -1 * threshold) {
        return 'D'; //drop
    }        
    return 'S'; //# steady
 }   

 function getThresholdValue(array) {
    maxValue = -Infinity;
    minValue = Infinity;
    for (var i = 0; i < array.length; i++ ) {
        maxValue = Math.max(maxValue, array[i]);
        minValue = Math.min(minValue, array[i]);
    }
    return thresholdPercent * (maxValue - minValue)
 }
var convert = {'R' : 0, 'S': 1, 'D' : 2};
var strength = {0:1, 1:0, 2:-1};
function getAverageSignal(signals) {
    var averagedSignal = new Array(signals[0].length);
    var PWM = [new Array(signals[0].length), new Array(signals[0].length), new Array(signals[0].length)];
    var minValue = Infinity;
    for (var i = 0; i< PWM[0].length; i++) {
        PWM[0][i] = 0;
        PWM[1][i] = 0;
        PWM[2][i] = 0;
    }
    for (var i = 0; i< signals.length; i++) {
        for (var j = 0; j < signals[0].length ; j++) {
            PWM[convert[signals[i][j]]][j] ++;
        }
    }
    for (var i = 0; i< PWM[0].length; i++) {
        var idx = 0;
        var maxFreq = -Infinity;
        for (var j = 0; j< PWM.length; j++) {
            if (maxFreq < PWM[j][i]) {
                idx = j;
                maxFreq = PWM[j][i];
            }
        }
        if (i === 0) {
            averagedSignal[i] = 0;
        } else {
            averagedSignal[i] = averagedSignal[i-1] + strength[idx];
        }
        minValue = Math.min(minValue, averagedSignal[i]);
        console.log(minValue);
    }
    for (var i = 0; i< averagedSignal.length; i++) {
        averagedSignal[i] = averagedSignal[i] - minValue;
    }
    console.log(averagedSignal);
    return averagedSignal;
}








/* Cloud */
function parseHTML(d) {
  parseText(d.replace(htmlTags, " ").replace(/&#(x?)([\dA-Fa-f]{1,4});/g, function(d, hex, m) {
    return String.fromCharCode(+((hex ? "0x" : "") + m));
  }).replace(/&\w+;/g, " "));
}

function getURL(url, callback) {
  statusText.text("Fetching… ");

  if (matchTwitter.test(url)) {
    var iframe = d3.select("body").append("iframe").style("display", "none");
    d3.select(window).on("message", function() {
      var json = JSON.parse(d3.event.data);
      callback((Array.isArray(json) ? json : json.results).map(function(d) { return d.text; }).join("\n\n"));
      iframe.remove();
    });
    iframe.attr("src", "http://jsonp.jasondavies.com/?" + encodeURIComponent(url));
    return;
  }

  try {
    d3.text(url, function(text) {
      if (text == null) proxy(url, callback);
      else callback(text);
    });
  } catch(e) {
    proxy(url, callback);
  }
}

function proxy(url, callback) {
  d3.text("//www.jasondavies.com/xhr?url=" + encodeURIComponent(url), callback);
}

function flatten(o, k) {
  if (typeof o === "string") return o;
  var text = [];
  for (k in o) {
    var v = flatten(o[k], k);
    if (v) text.push(v);
  }
  return text.join(" ");
}

function parseText(text) {
  tags = {};
  var cases = {};
  text.split(wordSeparators).forEach(function(word) {
    if (discard.test(word)) return;
    word = word.replace(punctuation, "");
    if (stopWords.test(word.toLowerCase())) return;
    word = word.substr(0, maxLength);
    cases[word.toLowerCase()] = word;
    tags[word = word.toLowerCase()] = (tags[word] || 0) + 1;
  });
  tags = d3.entries(tags).sort(function(a, b) { return b.value - a.value; });
  tags.forEach(function(d) { d.key = cases[d.key]; });
  generate();
}

function generate() {
  layout
      .font('Impact')
      .spiral("archimedean");
  fontSize = d3.scale["log"]().range([10, 100]);
  if (tags.length) fontSize.domain([+tags[tags.length - 1].value || 1, +tags[0].value]);
  complete = 0;
  statusText.style("display", null);
  words = [];
  layout.stop().words(tags.slice(0, max = Math.min(tags.length, +250))).start();
}

function progress(d) {
  statusText.text(++complete + "/" + max);
}

function draw(data, bounds) {
  statusText.style("display", "none");
  scale = bounds ? Math.min(
      w / Math.abs(bounds[1].x - w / 2),
      w / Math.abs(bounds[0].x - w / 2),
      h / Math.abs(bounds[1].y - h / 2),
      h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;
  words = data;
  var text = wordcloud.selectAll("text")
      .data(words, function(d) { return d.text.toLowerCase(); });
  text.transition()
      .duration(1000)
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; });
  text.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; })
      .on("click", function(d) {
        load(d.text);
      })
      .style("opacity", 1e-6)
    .transition()
      .duration(1000)
      .style("opacity", 1);
  text.style("font-family", function(d) { return d.font; })
      .style("fill", function(d) { return fill(d.text.toLowerCase()); })
      .text(function(d) { return d.text; });
  var exitGroup = background.append("g")
      .attr("transform", wordcloud.attr("transform"));
  var exitGroupNode = exitGroup.node();
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup.transition()
      .duration(1000)
      .style("opacity", 1e-6)
      .remove();
  wordcloud.transition()
      .delay(1000)
      .duration(750)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
}


function hashchange() {
  var h = location.hash;
  if (h && h.length > 1) {
    h = decodeURIComponent(h.substr(1));
    if (h !== fetcher) load(h);
  } else load(fetcher);
}

function load(f) {
  f = f || fetcher;
  fetcher = f;
  var h = /^https?:\/\//.test(fetcher)
      ? "#" + encodeURIComponent(fetcher)
      : "";
  if (fetcher != null) d3.select("#text").property("value", fetcher);
  if (location.hash !== h) location.hash = h;
  if (h) getURL(fetcher, parseHTML);
  else if (fetcher) parseText(fetcher);
}

(function() {
  var r = 40.5,
      px = 35,
      py = 20;

  var angles = d3.select("#angles").append("svg")
      .attr("width", 2 * (r + px))
      .attr("height", r + 1.5 * py)
    .append("g")
      .attr("transform", "translate(" + [r + px, r + py] +")");

  angles.append("path")
      .style("fill", "none")
      .attr("d", ["M", -r, 0, "A", r, r, 0, 0, 1, r, 0].join(" "));

  angles.append("line")
      .attr("x1", -r - 7)
      .attr("x2", r + 7);

  angles.append("line")
      .attr("y2", -r - 7);

  angles.selectAll("text")
      .data([-90, 0, 90])
    .enter().append("text")
      .attr("dy", function(d, i) { return i === 1 ? null : ".3em"; })
      .attr("text-anchor", function(d, i) { return ["end", "middle", "start"][i]; })
      .attr("transform", function(d) {
        d += 90;
        return "rotate(" + d + ")translate(" + -(r + 10) + ")rotate(" + -d + ")translate(2)";
      })
      .text(function(d) { return d + "°"; });

  var radians = Math.PI / 180,
      from,
      to,
      count,
      scale = d3.scale.linear(),
      arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(r);

  d3.selectAll("#angle-count, #angle-from, #angle-to")
      .on("change", getAngles)
      .on("mouseup", getAngles);

  getAngles();

  function getAngles() {
    count = +5;
    from = Math.max(-90, Math.min(90, +(-60)));
    to = Math.max(-90, Math.min(90, +60));
    update();
  }

  function update() {
    scale.domain([0, count - 1]).range([from, to]);
    var step = (to - from) / count;

    var path = angles.selectAll("path.angle")
        .data([{startAngle: from * radians, endAngle: to * radians}]);
    path.enter().insert("path", "circle")
        .attr("class", "angle")
        .style("fill", "#fc0");
    path.attr("d", arc);

    var line = angles.selectAll("line.angle")
        .data(d3.range(count).map(scale));
    line.enter().append("line")
        .attr("class", "angle");
    line.exit().remove();
    line.attr("transform", function(d) { return "rotate(" + (90 + d) + ")"; })
        .attr("x2", function(d, i) { return !i || i === count - 1 ? -r - 5 : -r; });

    var drag = angles.selectAll("path.drag")
        .data([from, to]);
    drag.enter().append("path")
        .attr("class", "drag")
        .attr("d", "M-9.5,0L-3,3.5L-3,-3.5Z")
        .call(d3.behavior.drag()
          .on("drag", function(d, i) {
            d = (i ? to : from) + 90;
            var start = [-r * Math.cos(d * radians), -r * Math.sin(d * radians)],
                m = [d3.event.x, d3.event.y],
                delta = ~~(Math.atan2(cross(start, m), dot(start, m)) / radians);
            d = Math.max(-90, Math.min(90, d + delta - 90)); // remove this for 360°
            delta = to - from;
            if (i) {
              to = d;
              if (delta > 360) from += delta - 360;
              else if (delta < 0) from = to;
            } else {
              from = d;
              if (delta > 360) to += 360 - delta;
              else if (delta < 0) to = from;
            }
            update();
          })
          .on("dragend", generate));
    drag.attr("transform", function(d) { return "rotate(" + (d + 90) + ")translate(-" + r + ")"; });
    layout.rotate(function() {
      return scale(~~(Math.random() * count));
    });
    /*
    d3.select("#angle-count").property("value", count);
    d3.select("#angle-from").property("value", from);
    d3.select("#angle-to").property("value", to);*/
  }

  function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
})();


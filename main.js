//important variables for program set up
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
let years = ["2016", "2017", "2018", "2019", "2020"]

// set up dimensions for each graph
let graph_1_width = MAX_WIDTH / 1.5, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 1.5), graph_2_height = 400;
let graph_3_width = MAX_WIDTH / 1.5, graph_3_height = 575;

//set up svg's for graphs
let svg = d3.select("#graph1")
    .append("svg")
    .attr("width", graph_1_width)   
    .attr("height", graph_1_height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top + 20})`); 

let svg2 = d3.select("#graph2")
    .append("svg")
    .attr("width", graph_2_width) 
    .attr("height", graph_2_height)   
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`); 

let svg3 = d3.select("#graph3")
    .append("svg")
    .attr("width", graph_3_width) 
    .attr("height", graph_3_height)   
    .append("g")
    .attr("transform", `translate(${margin.left+10}, ${margin.top + 30})`); 

// load data
d3.csv("../data/football.csv").then(function(data) {
    // gets number of games per year 
    data_by_year = cleanData(data)

    // x axis
    let x = d3.scaleLinear()
        .domain([0, 1200])
        .range([0, (graph_1_width - margin.left - margin.right)/2]);
    svg.append("g")
        .call(d3.axisBottom(x).tickSize(0).tickPadding(-10));

    // y axis
    let y = d3.scaleBand()
        .domain(years)
        .range([0, graph_1_height - margin.top -margin.bottom])
        .padding(0.1);  
    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    //build bars
    let bars = svg.selectAll("rect").data(data_by_year);

    //color scale
    let color = d3.scaleOrdinal()
        .range(d3.quantize(d3.interpolateHcl("#fee2f5", "#fa80d3"), 5));

    for (let i=0; i < data_by_year.length; i++) {
        bars.enter()
            .append("rect")
            .attr("fill", color(data_by_year[i]))
            .attr("x", 0)
            .attr("y", 5 + 32*i)               
            .attr("width", data_by_year[i]*.34)
            .attr("height",  y.bandwidth());         
    }
    //x-axis label
    svg.append("text")
        .attr("transform", `translate(${(graph_1_width-margin.left-margin.right)/4}, -15)`)    
        .style("text-anchor", "middle")
        .style("font-size", 13)
        .text("Count");

    //y-axis label
    svg.append("text")
        .attr("transform", `translate(-60, ${(graph_1_height-margin.top-margin.bottom)/2})`)   
        .style("text-anchor", "middle")
        .style("font-size", 13)
        .text("Year");

    //title
    svg.append("text")
        .attr("transform", `translate(${(graph_1_width-margin.left-margin.right)/4}, -40)`) 
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Number of Football Games By Year");
});

function cleanData(data) {
    // get number of games per year for five years (2016, 2017, 2018, 2019, 2020)
    var i;
    let year_16 = 0;
    let year_17 = 0;
    let year_18 = 0;
    let year_19 = 0;
    let year_20 = 0;
    for (var i = 0; i < data.length; i++) {
        date = data[i].date
        var year;
        for (var j = 0; j < 4; j++) {
            if (year == undefined || year.length ==4 ) {
                year = date[j]
            } 
            else {
                year += date[j]
            }         
        }
        if (year == "2016") {
            year_16 +=1;
        }
        if (year == "2017") {
            year_17 +=1;
        }
        if (year == "2018") {
            year_18 +=1;
        }
        if (year == "2019") {
            year_19 +=1;
        }
        if (year == "2020") {
            year_20 +=1;
        }
    }
    return [year_16, year_17, year_18, year_19, year_20]
}

function winningPercentage(data, win_margin) {
    //gets winning percentages for each team, win_margin can be used to detect whether the win was a big win or not
    let winning_percentage = new Map();
    for (var row = 0; row < data.length; row++) {
        home_t = data[row].home_team
        away_t = data[row].away_team
        home_win = 0
        away_win = 0
        let sum1 = parseInt(data[row].away_score) + parseInt(win_margin)
        let sum2 = parseInt(data[row].home_score) + parseInt(win_margin)
        if (parseInt(data[row].home_score) > sum1) {
            home_win = 1
        }
        if (sum2 < parseInt(data[row].away_score)) {
            away_win = 1
        }
        add_to_map(winning_percentage, home_t, home_win)
        add_to_map(winning_percentage, away_t, away_win)
    }
    //here we can create a new map for just [team, winning percentage]
    results = []
    for (let [key, value] of winning_percentage.entries()) {
        results.push([key, value.wins/value.games])
    }
    //sort by winning percentage descending and return top 10 results
    return results.sort(sorter).slice(0, 10);
}
function add_to_map(map, team, win) {
    //adds a team to the map or increments the information if it is already in the map
    if (map.has(team)) {
        info = map.get(team)
        map.delete(team)
        map.set(team, {wins: info.wins+=win, games: info.games+1})
    } else {
        map.set(team, {wins: win, games: 1})
    }
}
function sorter(a, b) {
    //sorts results
    if (a[1] > b[1]) {
        return -1
    } if (a[1] < b[1]) {
        return 1
    } else {
        return 0
    }
}

let tooltip = d3.select("#graph2")
    .append("div")
    .attr("class", "tooltip")
    //opacity should start at 0 so that tooltip is not immediately visible until hovering over circle
    .style("opacity", 0);

// Load data for graph 2
d3.csv("../data/football.csv").then(function(data) {
    //get proper data for chart
    winning_data = winningPercentage(data, 0)

    //for visually laying elements out on the screen
    placementIndices = [[50, 80], [200, 80], [350, 80], [50, 200], [200, 200], [350, 200], [50, 300], [150, 300], [250, 300], [350, 300]]
    function adjustText(i) {
        adjuster = -20
        if (i == 2 | i == 6 || i == 7 || i == 8) {
            adjuster = -40
        }
        return adjuster;
    }
    //Add chart title
    svg2.append("text")
        .attr("transform", `translate(${(graph_2_width-margin.left-margin.right)/4}, -10)`)  
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Winning Percentage for Top 10 Teams");

    //add circles and text
    let items = svg2.selectAll("circle").data(winning_data);
    let info = svg2.selectAll("text").data(winning_data);
    let color = d3.scaleOrdinal()
        .range(d3.quantize(d3.interpolateHcl("#fa80d3", "#fee2f5"), 10));
    for (let i=0; i < winning_data.length; i++) {
        items.enter()
            .append("circle")
            .merge(items)
            .attr("fill", function(d) { return color(winning_data[i][0]) })
            .attr("r",  winning_data[i][1] * 70) 
            .attr("transform", `translate(${placementIndices[i][0]}, ${placementIndices[i][1]})`)

            //functions for tooltip
            .on("mouseover", mouseOver)
            .on("mousemove", mouseMove)
            .on("mouseleave", mouseLeave)
        //circle labels
        info.enter().append("text")
            .attr("transform", `translate(${placementIndices[i][0] + adjustText(i)}, ${placementIndices[i][1]})`)
            .text(winning_data[i][0])
            .style("font-size", 10)
    }
    function mouseOver(d) {
        //set opacity to 1 so that tooltip for that circle is visible
        tooltip.style("opacity", 1);
    }

    function mouseMove(d) {
        let percent = 0
        let country = ""
        let x_offset = 190
        let y_offset = 380
        for (let i = 0; i < winning_data.length; i++) {
            abs_diff = Math.abs(d3.event.pageX - placementIndices[i][0] - x_offset) + Math.abs(d3.event.pageY - placementIndices[i][1] - y_offset)
            threshold = winning_data[i][1] * 90
            if (abs_diff <= threshold) {
                country = winning_data[i][0]
                percent = winning_data[i][1]
            }
        }
        //display appropriate text for that circel
        let html = `Winning Percentage of ${country} is ${percent}`
        tooltip.html(html)
            .style("left", placementIndices[0][0]+ 260 + "px")
            .style("bottom", placementIndices[0][1] + 295 + "px")
    }

    function mouseLeave() {
        //set opacity back to 0 when we leave a circle
        tooltip.style("opacity", 0);
    }
});

//x axis
let x = d3.scaleLinear()
    .domain([0, 1])
    .range([0, (graph_3_width - margin.left - margin.right)/2]);
svg3.append("g")
    .call(d3.axisBottom(x).tickSize(0).tickPadding(-10));

//title
let title = svg3.append("text")
    .attr("transform", `translate(${(graph_3_width-margin.left-margin.right)/4}, -40)`)
    .style("text-anchor", "middle")
    .style("font-size", 15)
    .text("World Cup Bests of 2018");

//x axis label
let x_axis_label = svg3.append("text")
    .attr("transform", `translate(${(graph_3_width-margin.left-margin.right)/4 - 50}, -15)`)
    .style("font-size", 13)
    .text("Winning Percentage")

//y axis label
let y_axis_label = svg3.append("text")
    .attr("transform", `translate(-120, ${graph_3_height/4})`)
    .style("font-size", 13)
    .text("Country")

//y axis
let y = d3.scaleBand()
    .range([0, (graph_3_height - margin.top -margin.bottom)/1.5])
    .padding(0.1); 
y_axis = svg3.append("g")
    .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

//function to render data for appropriate year
function setData(year, margin) {
    d3.csv("../data/football.csv").then(function(data) {
        //set title based on button pressed
        if (margin) {
            title.html(`${year} World Cup - Top 10 Countries and Their Big Win Percentage`)
        } else {
            title.html(`${year} World Cup - Top 10 Countries and Their Win Percentage`)
        }
        //get appropriate data based on button pressed
        yearly_data = wc_data(data, year)
        top10_wins = winningPercentage(yearly_data, parseInt(margin))

        countries = []
        for (let i=0; i < top10_wins.length; i++) {
            countries.push(top10_wins[i][0])
        }
        function placement(country) {
            for (let i = 0; i < countries.length; i++) {
                if (country == countries[i]) {
                    return 5+ 32 *i;
                }
            }
        }
        //y axis
        y.domain(countries)
        y_axis.call(d3.axisLeft(y).tickSize(0).tickPadding(10));
        
        //add x axis labels
        let bars = svg3.selectAll("rect").data(top10_wins);

        //add color
        let color = d3.scaleOrdinal()
            .range(d3.quantize(d3.interpolateHcl("#fa80d3", "#fee2f5"), countries.length));

        //build bars
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) {return color(d[1])})
            .transition()
            .attr("x", 0)
            .attr("y", function(d) {return placement(d[0])})
            .attr("width", function(d) {return d[1] * 410})
            .attr("height",  y.bandwidth());   
        bars.exit().remove();  
    });
}

//default to render on page load
setData("2014", 0)

//gets world cup games for the given year
function wc_data(data, year) {
    wc_data_by_year = []
    for (let i=0; i < data.length; i++) {
        date = data[i].date
        var curr_year;
        for (var j = 0; j < 4; j++) {
            if (curr_year == undefined || curr_year.length ==4 ) {
                curr_year = date[j]
            } 
            else {
                curr_year += date[j]
            }         
        }
        if (data[i].tournament == "FIFA World Cup" && curr_year == year) {
            wc_data_by_year.push(data[i])
        }
    }
    return wc_data_by_year
}

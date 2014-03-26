/**
 * Created by Sebastian on 11/1/13.
 */
function run(){
    FB.login(afterlogin,{scope: 'user_events'} )
}

function afterlogin(response){
    console.log("Success!");
    FB.api('/me', {fields: 'events.limit(13)'}, eventslistFB );
}

function eventslistFB(response){
    //This function exists exclusively to cut a layer of the response object provided by FB.api
    //So we can universalize the eventslist function to work with FB's pagination system.
    eventslist(response.events);
}
function eventslist(eventsObject) {
    //Clear most of the page and replace it with the new display data from our latest api call (pagination or button)

    $("#selectiondisplay").css("display", "inline");
    console.log(eventsObject);
    $(".emptyonload").empty();
    $("#eventdisplay").css("display", "inline");
    $("#eventdisplay").append("Please select an event");
    $("#list").append("<h2>Events:</h2>");
    $("#list").append("<ul id=\"eventslist\">");
    for (var i = 0; i < eventsObject.data.length; i++) {
        element = eventsObject.data[i];
        console.log(element.name);
        $("#list").append("<li><a onclick=\"searchEvent("+ element.id + ")\" href=#>"+ element.name + "</a></li>");
    }
    $("#list").append("</ul>");

    //We define the print functions as children so we can keep access to the eventsObject
    function printPrev(res){
        if(res.data.length > 0){
            $("#prevbutton").append("<a onclick=\"$.get('"+eventsObject.paging.previous+"', eventslist)\" href=#><- Previous</a>");
        }
    }
    function printNext(res){
        if(res.data.length > 0){
            $("#nextbutton").append("<a onclick=\"$.get('"+eventsObject.paging.next+"', eventslist)\" href=#>Next -></a>");
        }
    }
    //FB doesn't tell you if the next "pages" have data, so we need to check ourselves whether they exist.
    $.get(eventsObject.paging.previous, printPrev)
    $.get(eventsObject.paging.next, printNext)

}

function searchEvent(id){
    FB.api("/"+id.toString(), {fields: 'attending.fields(gender,last_name),description,name,owner,parent_group,cover'}, eventDisplay);
}

function eventDisplay(data){
    console.log("WE GOT DA DATA");
    console.log(data);
    $("#eventdisplay").empty();
    $("#eventdisplay").append("<h2>"+data.name+"</h1>");
    //$("#eventdisplay").append("<h4>Created by: "+data.owner.name+"</h4>");
    $("#eventdisplay").append("<h4>Total Attending: "+data.attending.data.length.toString()+"</h4>");
    var male = 0;
    var female = 0;
    var total = 0;
    for (var i = 0; i < data.attending.data.length; i++){
        element = data.attending.data[i];
        if (element.gender == "male") {
            male++;
        }else{
            female++;
        }
        total++;
    }
    var malesperfemale = male/female;
    var femalespermale = female/male;

    var colors = ["#C9A0F6", "#44D1C4"];

    $("#eventdisplay").append("There are <strong>"+male+" men</strong> attending and <strong>"+female+" women</strong>, leading to a ratio of <strong>"+ malesperfemale+" men per woman</strong> or <strong>"+femalespermale+" women per man</strong>.<br>");
    
    //Handle making a the pie chart with d3
    var svg1 = d3.select("#eventdisplay").append("svg").attr("width", "400").attr("height", "400");//Create teh SVG
    var arc = d3.svg.arc() //Set up the arc generator
    .outerRadius(150)
    .innerRadius(90);
    
    var pie = d3.layout.pie()
        .value(function(d) { return d.value;}) //Set up the pie generator to get the data value
        .startAngle(0.8*Math.PI)//Rotate the chart a bit
        .endAngle(2.8*Math.PI);


    var duration = 500; //We set this as a variable because it's used in a few places and we want to be able to configure it.


    var malesandfemales = [{name: "men", value: male, color: colors[1]}, {name: "women", value: female, color: colors[0]}]
    console.log(pie(malesandfemales));
    svg1.append("g").attr("class", "donut");
    var group1 = svg1.select(".donut")//Put stuff to modify graph (like location) here.
        .selectAll(".arc") //We're selecting all .arcs even though they don't exist.
        .data(pie(malesandfemales)) //Data to generate placeholders from
        .enter() //Placeholders for missing .arc
        .append("g") //Generate g from the placeholders
        .attr("class", "arc") //Set class to actually be .arc
        .attr("transform", "translate(" + svg1.attr("width")/2 + ", " + svg1.attr("height")/2 +")"); //Move it to the right place.
    group1.append("path") //Add the path
        //.attr("d", arc) //Make it from the arc generator
        .style("fill", function(d) {console.log(d); return d.data.color;}) //Add coloring.
        .transition() //Activate transition for when we start generating the chart
        //.delay(function(data, index) {console.log((duration-(data.data.value/total * duration)) * index); return (duration-(data.data.value/total * duration)) * index;})
        .ease("linear")
        .duration(duration)//function(d){return duration*d.data.value/total;})
        .attrTween('d', function(d, i){
            var gen1 = d3.interpolate(d.startAngle, d.endAngle);
            var gen2 = d3.interpolate(d.endAngle, d.startAngle);
            return function (t){
                if(i == 1){
                    d.endAngle = gen1(t);
                }else{
                    d.startAngle = gen2(t);
                }
                return arc(d);
            };});
    group1.append("text") //Append to both g elements.
        .attr("transform", function(d){ return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", "-0.5em") //Styling
        .style("text-anchor", "middle") //Styling
        .attr("fill", "#000000") //Styling
        .transition()
        .delay(duration)
        .text(function(d) { return Math.round(d.data.value/total * 1000)/10 +"%";}); //Return male or female

    group1.append("text") //Append to both g elements.
        .attr("transform", function(d){ return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", "0.5em") //Styling
        .attr("fill", "#000000") //Styling
        .transition()
        .delay(duration)
        .text(function(d) { return d.data.name;}); //Return male or female

    //Handle making the bar graph with d3.
    var barWidth = 100, chartHeight = 315;

    var svg2 = d3.select("#eventdisplay").append("svg").attr("width","400").attr("height", chartHeight);
    svg2.append("g")
        .attr("class", "bargraph");

    var rectGraph = d3.scale.linear()
        .domain([0, d3.max([male, female])])
        .range([0, chartHeight]);

    var group2 = svg2.select(".bargraph")
        .selectAll(".bar")
        .data(malesandfemales)
        .enter()
        .append("g")
        .attr("class", "bar")
        .attr("transform", function(d, i) { return "translate("+ ((0.5+i)*barWidth*1.5) +", 0)";});
    group2.append("rect")
        .attr("fill", function(d) {return d.color;})
        .attr("width", barWidth)
        .transition()
        .ease("linear")
        .duration(duration)
        .attrTween("y", function(d, i){
            var gen = d3.interpolate(chartHeight, chartHeight-rectGraph(d.value));
            return function(t){
                return gen(t);
            };
        })
        .attrTween("height", function(d, i){
            var gen = d3.interpolate(0, rectGraph(d.value));
            return function(t){
                return gen(t);
            };
        });
        //.attr("height", function(d){return rectGraph(d.value);})

    group2.append("text")
        .attr("transform", function(d){ return "translate("+barWidth/2+","+(chartHeight-(rectGraph(d.value)/2))+")";})
        .attr("dy", "-0.5em")
        .attr("fill", "#000000")
        .transition()
        .delay(duration)
        .text(function(d) {return d.value;});

    group2.append("text")
        .attr("transform", function(d){ return "translate("+barWidth/2+","+(chartHeight-(rectGraph(d.value)/2))+")";})
        .attr("dy", "0.5em")
        .attr("fill", "#000000")
        .transition()
        .delay(duration)
        .text(function(d) {return d.name});
    




}

/**
 * Created by Sebastian on 11/1/13.
 */
function run(){
    FB.login(afterlogin,{scope: 'user_events'} )
}

function afterlogin(response){
    console.log("Success!");
    FB.api('/me', {fields: 'events'}, eventslistFB );
}

function eventslistFB(response){
    //This function exists exclusively to cut a layer of the response object provided by FB.api
    //So we can universalize the eventslist function to work with FB's pagination system.
    eventslist(response.events);
}
function eventslist(eventsObject) {
    //Clear most of the page and replace it with the new display data from our latest api call (pagination or button)

    console.log(eventsObject);
    $(".emptyonload").empty();
    for (var i = 0; i < eventsObject.data.length; i++) {
        element = eventsObject.data[i];
        console.log(element.name);
        $("#list").append("<a onclick=\"searchEvent("+ element.id + ")\" href=#>"+ element.name + "</a><br />");
    }

    //We define the print functions as children so we can keep access to the eventsObject
    function printPrev(res){
        if(res.data.length > 0){
            $("#prevbutton").append("<a onclick=\"$.get('"+eventsObject.paging.previous+"', eventslist)\" href=#>Previous</a>");
        }
    }
    function printNext(res){
        if(res.data.length > 0){
            $("#nextbutton").append("<a onclick=\"$.get('"+eventsObject.paging.next+"', eventslist)\" href=#>Next</a>");
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
    $("#eventdisplay").append("<h4>Created by: "+data.owner.name+"</h4>");
    $("#eventdisplay").append("<h4>Total:"+data.attending.data.length.toString()+"</h4>");
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

    var colors = ["#B990E6", "#04A194"];

    $("#eventdisplay").append("There are <strong>"+male+" males</strong> attending and <strong>"+female+" females</strong>, leading to a ratio of <strong>"+ malesperfemale+" males per female</strong> or <strong>"+femalespermale+" females per male</strong>.<br>");
    
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

    malesandfemales = [{name: "males", value: male, color: colors[1]}, {name: "females", value: female, color: colors[0]}]
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
        .attr("dy", "0.8 em") //Styling
        .style("text-anchor", "middle") //Styling
        .attr("fill", "#FFFFFF") //Styling
        .text(function(d) { return d.data.value +" "+ d.data.name;}); //Return male or female

    //Handle making the bar graph with d3.
    var svg2 = d3.select("#eventdisplay").append("svg").attr("width","400").attr("height", "400");
        
    




}

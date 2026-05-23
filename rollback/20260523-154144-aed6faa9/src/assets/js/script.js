$(function(){
	if($('.list') && $('.list').offset())
	{
		var pic_X=$('.list').offset().left;
		var pic_W=$('.list').width()/2;
		var center_X=pic_X+pic_W;
		var movestop=pic_W/10;
		$('.list').mousemove(function(event){
			var mouse_X=event.pageX;
			var mouse_Y=event.pageY;
			if(mouse_X-center_X<=0){
				moveImg(mouse_X,mouse_Y,'left')
			}else{
				moveImg(mouse_X,mouse_Y)
			}
		});
	}
	
	
	function moveImg(m_X,m_Y,dir){
		var index=Math.ceil(Math.abs(m_X-center_X)/movestop);
		if(dir){
			$('.list li').eq(index).show().siblings().hide();
		}else{
			$('.list li').eq($('.list li').length-index).show().siblings().hide();
		}
	}
})
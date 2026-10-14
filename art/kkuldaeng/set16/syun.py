# 주아체에 없는 '슌'을 '순'에서 만든다: ㅜ의 가운데 세로획을 잘라 좌우 두 개로 → ㅠ.
import numpy as np
from PIL import Image, ImageDraw, ImageFont
FONT='/Users/mydang/Claude_Code/saidam/art/fonts/Jua.ttf'
def glyph_mask(ch, size):
    f=ImageFont.truetype(FONT,size); bb=ImageDraw.Draw(Image.new('L',(8,8))).textbbox((0,0),ch,font=f)
    im=Image.new('L',(bb[2]-bb[0]+20, bb[3]-bb[1]+20),0); ImageDraw.Draw(im).text((10-bb[0],10-bb[1]),ch,font=f,fill=255)
    return im
def syun(size):
    m=np.array(glyph_mask('순',size)).astype(np.uint8)
    h,w=m.shape; on=m>128
    cols_on=np.where(on.any(0))[0]; gx0,gx1=cols_on.min(),cols_on.max(); gcx=(gx0+gx1)/2; gw=gx1-gx0
    rows=on.sum(1)
    # ㅜ 가로획: 글자 폭의 70% 넘게 이어진 줄 중 위쪽 것들
    wide=[y for y in range(h) if rows[y]>gw*0.7]
    bar=[y for y in wide if y<h*0.75]
    # 가로획 묶음의 아랫줄
    bar_bottom=bar[0]
    for y in bar:
        if y-bar_bottom<=2 or y==bar[0]: bar_bottom=y
        else: break
    # 가운데 창(±12%)에서 가로획 바로 아래 이어지는 세로획
    win=slice(int(gcx-gw*0.12), int(gcx+gw*0.12))
    y=bar_bottom+1
    while y<h and on[y,win].any(): y+=1
    y0,y1=bar_bottom+1,y-1
    cc=np.where(on[y0:y1+1,win].any(0))[0]+win.start; x0,x1=cc.min(),cc.max(); sw=x1-x0+1; cx=(x0+x1)/2
    stem=m[y0-2:y1+1,x0:x1+1].copy()
    out=m.copy(); out[y0:y1+1,x0:x1+1]=0
    off=int(sw*0.78)
    for nx in (int(round(cx-off-sw/2)), int(round(cx+off-sw/2))):
        reg=out[y0-2:y1+1,nx:nx+sw]; out[y0-2:y1+1,nx:nx+sw]=np.maximum(reg,stem[:, :reg.shape[1]])
    return Image.fromarray(out)
if __name__=='__main__':
    a=glyph_mask('순',300); b=syun(300); c=glyph_mask('슈',300)
    W=a.width+b.width+c.width+40; im=Image.new('L',(W,max(a.height,b.height,c.height)),0)
    im.paste(a,(0,0)); im.paste(b,(a.width+20,0)); im.paste(c,(a.width+b.width+40,0))
    Image.eval(im,lambda v:255-v).save('/private/tmp/claude-501/-Users-mydang-Claude-Code-Kkom-Morning/3f3602ba-60f3-4dfa-a0fb-69c10caa472f/scratchpad/set16/syun-test.png')

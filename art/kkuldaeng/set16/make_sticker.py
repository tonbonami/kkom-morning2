# 초록 배경 정지 그림 → 투명 + 한글 배지 스티커(webp 320).
# 사이담 make-transparent(colorkey+despill)는 노랑을 살구색으로 바꾼다(despill이 G를 (R+B)/2로 깎음).
# 꿀댕이는 조끼가 통째로 노랑이라, "G가 R·B 둘 다보다 큰 만큼"만 초록으로 보고 빼고, 그 픽셀만 G=max(R,B)로 눌러 준다.
# 배지 규칙은 사이담 add-emo-label.mjs와 같다(Jua, 잉크 #64493D, 흰 테두리 글자높이 0.05, 위 24% 띠, -4도).
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
FONT='/Users/mydang/Claude_Code/saidam/art/fonts/Jua.ttf'
INK=(0x64,0x49,0x3D); EDGE=(255,255,255); STROKE=0.05; BAND=0.24; W=H=320

def key(path):
    a=np.array(Image.open(path).convert('RGB')).astype(np.int32)
    r,g,b=a[...,0],a[...,1],a[...,2]
    spill=g-np.maximum(r,b)
    al=np.clip(255-(spill-18)*255/50,0,255).astype(np.uint8)
    g2=np.where(spill>0,np.maximum(r,b),g)
    rgba=np.dstack([r,g2,b,al]).astype(np.uint8)
    # 떠돌이 조각 정리: 큰 덩어리의 0.3% 미만이면서 초록기 있는 것만(반짝이·하트 같은 소품은 남긴다)
    on=al>40; lab,n=ndimage.label(on)
    if n>1:
        sizes=ndimage.sum(on,lab,range(1,n+1)); keep_min=sizes.max()*0.003
        for i,sz in enumerate(sizes):
            if sz<keep_min:
                m=lab==(i+1)
                if sz<6 or (g[m].mean()>np.maximum(r[m],b[m]).mean()): rgba[m,3]=0
    return Image.fromarray(rgba)

def badge(text,size):
    import sys; sys.path.insert(0,__import__('os').path.dirname(__file__))
    from syun import glyph_mask, syun
    from PIL import ImageFilter, ImageChops
    S=4  # 크게 그려 줄여서 매끈하게
    def masks(sz):
        # 띄어쓰기는 잉크가 없어 getbbox()가 None → 글자 폭 0.32만큼 빈 칸(투명 1줄)으로 둔다(「꽃 줄게」).
        ms=[]
        for ch in text:
            if ch.isspace():
                g=Image.new('L',(max(1,int(sz*S*0.32)),1),0); g.putpixel((0,0),1); ms.append(g); continue
            g=syun(sz*S) if ch=='슌' else glyph_mask(ch,sz*S)
            ms.append(g)
        return ms
    def width(ms,st): return sum(m.width for m in ms)
    ms=masks(size)
    # 글자 높이 기준(가장 큰 글자의 잉크 높이)
    st=max(1,int(size*STROKE))*S
    track=(max(2,int(size*0.03))*S)+st*2
    tw=sum(m.getbbox()[2]-m.getbbox()[0] for m in ms)+track*(len(ms)-1)
    if tw>W*0.86*S:
        size=int(size*W*0.86*S/tw); ms=masks(size); st=max(1,int(size*STROKE))*S; track=(max(2,int(size*0.03))*S)+st*2
    crops=[m.crop(m.getbbox()) for m in ms]
    H0=max(c.height for c in crops); base=max(c.getbbox()[3] for c in crops)
    pad=max(4,size//8)*S+st
    Wb=sum(c.width for c in crops)+track*(len(crops)-1)+pad*2
    ink=Image.new('L',(Wb,H0+pad*2),0); x=pad
    # 세로 위치: 원래 글꼴 박스의 아랫선 맞춤 대신 글자별 원래 위치 유지 — glyph_mask의 위쪽 여백 기준
    tops=[m.getbbox()[1] for m in ms]; mt=min(tops)
    for m,c in zip(ms,crops):
        ink.paste(c,(x,pad+m.getbbox()[1]-mt),c); x+=c.width+track
    edge=ink.filter(ImageFilter.MaxFilter(st*2+1))
    img=Image.new('RGBA',ink.size,(0,0,0,0))
    img.paste(Image.new('RGBA',ink.size,EDGE+(255,)),(0,0),edge)
    img.paste(Image.new('RGBA',ink.size,INK+(255,)),(0,0),ink)
    img=img.resize((max(1,img.width//S),max(1,img.height//S)),Image.LANCZOS)
    return img.rotate(-4,resample=Image.BICUBIC,expand=True)

def make(src,text,dst):
    dog=key(src); box=dog.split()[3].point(lambda v:255 if v>20 else 0).getbbox(); dog=dog.crop(box)
    bd=badge(text,int(H*BAND*0.62)); bx=(W-bd.size[0])//2; by=max(0,int(H*BAND*0.5)-bd.size[1]//2)
    band_px=by+bd.size[1]; gap=int(H*0.04)
    k=min(W*0.82/dog.size[0], W*0.90/dog.size[0], (H-gap-band_px)/dog.size[1])
    dog=dog.resize((max(1,int(dog.size[0]*k)),max(1,int(dog.size[1]*k))),Image.LANCZOS)
    c=Image.new('RGBA',(W,H),(0,0,0,0)); c.alpha_composite(dog,((W-dog.size[0])//2,H-dog.size[1]-gap)); c.alpha_composite(bd,(bx,by))
    c.save(dst,format='WEBP',quality=86,method=6)
    return dog.size

if __name__=='__main__':
    print(make(sys.argv[1],sys.argv[2],sys.argv[3]))

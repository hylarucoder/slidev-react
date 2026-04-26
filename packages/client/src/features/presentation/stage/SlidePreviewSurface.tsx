import { useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import type { SlideMeta, SlideComponent } from "@slidev-react/core/slides/slide";
import type { SlidesConfig } from "../presenter/model/types";
import { useResolvedLayout } from "../../../theme/useResolvedLayout";
import { resolveSlideSurface, resolveSlideSurfaceClassName } from "./slideSurface";
import { useSlideScale } from "./slideViewport";
import { SlideErrorBoundary } from "./SlideErrorBoundary";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

type SlideArticleProps = HTMLAttributes<HTMLElement> & {
  "data-export-surface"?: string;
};

function SlidePreviewFrame({
  Slide,
  meta,
  slidesConfig,
  content,
  shadowClass,
  overflowHidden,
  articleProps,
}: {
  Slide: SlideComponent;
  meta: SlideMeta;
  slidesConfig: Pick<SlidesConfig, "slidesViewport" | "slidesLayout" | "slidesBackground">;
  content?: ReactNode;
  shadowClass?: string;
  overflowHidden: boolean;
  articleProps?: SlideArticleProps;
}) {
  const { slidesViewport, slidesLayout, slidesBackground } = slidesConfig;
  const Layout = useResolvedLayout(meta.layout ?? slidesLayout);
  const {
    className: articleClassName,
    style: articleStyle,
    ...restArticleProps
  } = articleProps ?? {};
  const surface = resolveSlideSurface({
    meta,
    slidesBackground,
    className: resolveSlideSurfaceClassName({
      layout: meta.layout ?? slidesLayout,
      shadowClass,
      overflowHidden,
    }),
  });

  return (
    <article
      {...restArticleProps}
      className={joinClassNames(surface.className, articleClassName)}
      style={{
        ...surface.style,
        ...articleStyle,
        width: `${slidesViewport.width}px`,
        height: `${slidesViewport.height}px`,
      }}
    >
      {content ?? (
        <Layout>
          <Slide />
        </Layout>
      )}
    </article>
  );
}

export function SlidePreviewSurface({
  Slide,
  slideId,
  meta,
  slidesConfig,
  content,
  viewportClassName,
  viewportStyle,
  stageClassName,
  shadowClass,
  overflowHidden = false,
  scaleMultiplier = 1,
  alignment = "center",
  articleProps,
}: {
  Slide: SlideComponent;
  slideId: string;
  meta: SlideMeta;
  slidesConfig: Pick<SlidesConfig, "slidesViewport" | "slidesLayout" | "slidesBackground">;
  content?: ReactNode;
  viewportClassName?: string;
  viewportStyle?: CSSProperties;
  stageClassName?: string;
  shadowClass?: string;
  overflowHidden?: boolean;
  scaleMultiplier?: number;
  alignment?: "center" | "top-left";
  articleProps?: SlideArticleProps;
}) {
  const { slidesViewport } = slidesConfig;
  const { viewportRef, scale, offset, ready } = useSlideScale(
    scaleMultiplier,
    alignment,
    slidesViewport,
  );
  const viewportStageStyle = useMemo(
    () => ({
      width: `${slidesViewport.width}px`,
      height: `${slidesViewport.height}px`,
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
      transformOrigin: "top left",
      opacity: ready ? 1 : 0,
    }),
    [slidesViewport.height, slidesViewport.width, offset.x, offset.y, scale, ready],
  );

  return (
    <div ref={viewportRef} className={viewportClassName} style={viewportStyle}>
      <div className={stageClassName} style={viewportStageStyle}>
        <SlideErrorBoundary resetKey={slideId} slideId={slideId} title={meta.title} compact>
          <SlidePreviewFrame
            Slide={Slide}
            meta={meta}
            slidesConfig={slidesConfig}
            content={content}
            shadowClass={shadowClass}
            overflowHidden={overflowHidden}
            articleProps={articleProps}
          />
        </SlideErrorBoundary>
      </div>
    </div>
  );
}

# Proposal

## Why

Фоновая анимация в стиле omp.sh уже есть (`add-omp-style-light-bg-animation`), но визуально не хватает «отлетающих» точек / spray над гребнем волны — в референсе omp.sh над плотной дугой виден облачный рой ярких частиц, у нас край волны резкий и spray отсутствует (подтверждено скринами).

## What Changes

- Добавить слой **flying dots / spray**: разреженные дискретные точки, вылетающие наружу от гребня дуги в прозрачную зону (не только tint внутри маски).
- Исправить CPU poster (`ompPoster.ts`): silver/spray не должен отбрасывать пиксели с `alpha === 0`.
- Дополнить GPU stencil (`ompGpu.ts`): помимо soft mist — редкие яркие speckles с falloff от crest.
- Сохранить белый base, flip, scanlines, hue-цикл и reduced-motion; не переписывать всю анимацию.

## Capabilities

### New Capabilities

### Modified Capabilities
- `omp-style-bg-animation`: требование spray/flying dots над гребнем волны (CPU + GPU path)

## Impact

- Код: `src/lib/ompPoster.ts`, `src/lib/ompGpu.ts` (+ точечные тесты); компонент `OmpStyleBackground` без смены API.
- Визуал: на белом фоне spray — tinted (violet/plum/sky/silver), не pure-white на dark как у omp.
- Связанный issue фичи: STAR-10; фидбек/скриншоты пришли в треде STAR-9.

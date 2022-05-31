FROM denoland/deno:1.22.1

EXPOSE 8000

USER deno

COPY src/*.ts /opt/app/
RUN deno cache /opt/app/index.ts

WORKDIR /opt/app

ENTRYPOINT [ "deno" ]
CMD [ "run", "--allow-net", "--allow-env", "/opt/app/index.ts" ]
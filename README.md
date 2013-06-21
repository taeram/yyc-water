Slideshare to PDF
=================

A web app which accepts a slideshare.net URL, generates a PDF, and saves
the PDF to Amazon S3.

Setup
=====

Requirements:
* A Heroku account
* An Amazon S3 account
* A bucket for your PDF files
* Your Amazon AWS Access Key and Secret Key
* Your timezone, in the format Country/City. Eg. "America/Denver"

```bash
heroku config:set AWS_ACCESS_KEY=secret \
                  AWS_SECRET_KEY=secret \
                  S3_BUCKET=my-bucket \
                  TZ="America/Denver"
```

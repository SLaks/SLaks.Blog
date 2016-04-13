---
title: "Covariance in Java vs. C#"
layout: "post"
categories: [type-theory, generics, variance]
---

# Part 1

## What is covariance
Type functions
Convertibility

## When is covariance safe
Immutability
Parking garage with entrance and exit

## About casting
Different kinds of conversions (see C# spec)
View of a type
Base classes work implicitly
Interfaces are just views

## How covariance is used
Covariance is also just a view &ndash; doesn't affect fields

# Part 2
C# and Java both support co- / contra- variant types, but in very different ways.

Java allows you to create co/contra variant "views" of a type using so-called "wildcard" parameters.

C# makes separate interfaces